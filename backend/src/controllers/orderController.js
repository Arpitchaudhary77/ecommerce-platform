const crypto = require('crypto');
const { z } = require('zod');

const {
  pool,
} = require('../db');

const createOrderSchema = z.object({
  addressId: z
    .string()
    .uuid(),

  paymentMethod: z
    .enum(['COD']),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal('')),
});

const FREE_SHIPPING_THRESHOLD_PAISE =
  99900;

const SHIPPING_FEE_PAISE =
  9900;

function toPaise(value) {
  return Math.round(
    Number(value) * 100
  );
}

function fromPaise(value) {
  return (
    value / 100
  ).toFixed(2);
}

function createOrderNumber() {
  const now =
    new Date();

  const timestamp =
    now
      .toISOString()
      .replace(/\D/g, '')
      .slice(0, 14);

  const suffix =
    crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase();

  return `NOVA-${timestamp}-${suffix}`;
}

async function ensureCart(
  client,
  userId
) {
  const result =
    await client.query(
      `
        INSERT INTO carts (
          user_id
        )
        VALUES ($1)
        ON CONFLICT (user_id)
        DO UPDATE SET
          updated_at = NOW()
        RETURNING id
      `,
      [userId]
    );

  return result.rows[0].id;
}

function badRequest(
  message
) {
  const error =
    new Error(message);

  error.status = 400;

  return error;
}

function conflict(
  message
) {
  const error =
    new Error(message);

  error.status = 409;

  return error;
}

async function createOrder(
  req,
  res,
  next
) {
  const parsed =
    createOrderSchema.safeParse(
      req.body
    );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message:
        'Invalid checkout data',
      errors:
        parsed.error.flatten()
          .fieldErrors,
    });
  }

  const {
    addressId,
    paymentMethod,
    notes,
  } = parsed.data;

  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN'
    );

    /*
     * ------------------------------------------------------
     * 1. Verify the shipping address belongs to the user.
     * ------------------------------------------------------
     */
    const addressResult =
      await client.query(
        `
          SELECT
            id,
            label,
            first_name AS "firstName",
            last_name AS "lastName",
            phone,
            address_line_1 AS "addressLine1",
            address_line_2 AS "addressLine2",
            city,
            state,
            postal_code AS "postalCode",
            country,
            is_default AS "isDefault"
          FROM addresses
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [
          addressId,
          req.user.id,
        ]
      );

    if (
      !addressResult.rows.length
    ) {
      throw badRequest(
        'Selected shipping address was not found'
      );
    }

    const address =
      addressResult.rows[0];

    /*
     * ------------------------------------------------------
     * 2. Get the customer's cart.
     * ------------------------------------------------------
     */
    const cartId =
      await ensureCart(
        client,
        req.user.id
      );

    /*
     * ------------------------------------------------------
     * 3. Load cart items and LOCK the product rows.
     *
     * This prevents inventory from changing underneath
     * the checkout transaction.
     * ------------------------------------------------------
     */
    const cartResult =
      await client.query(
        `
          SELECT
            ci.id,
            ci.product_id AS "productId",
            ci.quantity,

            p.name,
            p.sku,
            p.price,
            p.stock_quantity AS "stockQuantity",
            p.images,
            p.is_active AS "isActive"

          FROM cart_items ci

          INNER JOIN products p
            ON p.id = ci.product_id

          WHERE ci.cart_id = $1

          ORDER BY ci.created_at ASC

          FOR UPDATE OF ci, p
        `,
        [cartId]
      );

    if (
      !cartResult.rows.length
    ) {
      throw badRequest(
        'Your cart is empty'
      );
    }

    /*
     * ------------------------------------------------------
     * 4. Validate product availability and stock.
     * ------------------------------------------------------
     */
    for (
      const item of cartResult.rows
    ) {
      if (!item.isActive) {
        throw conflict(
          `${item.name} is no longer available`
        );
      }

      if (
        item.quantity >
        item.stockQuantity
      ) {
        throw conflict(
          `Only ${item.stockQuantity} units of ${item.name} are available`
        );
      }
    }

    /*
     * ------------------------------------------------------
     * 5. Calculate money using integer paise.
     *
     * Never trust the browser's totals.
     * ------------------------------------------------------
     */
    let subtotalPaise = 0;

    const orderItems =
      cartResult.rows.map(
        (item) => {
          const unitPricePaise =
            toPaise(
              item.price
            );

          const lineTotalPaise =
            unitPricePaise *
            item.quantity;

          subtotalPaise +=
            lineTotalPaise;

          return {
            productId:
              item.productId,

            productName:
              item.name,

            sku:
              item.sku,

            imageUrl:
              Array.isArray(
                item.images
              )
                ? item.images[0] ||
                  null
                : null,

            unitPricePaise,

            quantity:
              item.quantity,

            lineTotalPaise,
          };
        }
      );

    const shippingPaise =
      subtotalPaise >=
      FREE_SHIPPING_THRESHOLD_PAISE
        ? 0
        : SHIPPING_FEE_PAISE;

    const taxPaise = 0;
    const discountPaise = 0;

    const totalPaise =
      subtotalPaise +
      shippingPaise +
      taxPaise -
      discountPaise;

    /*
     * ------------------------------------------------------
     * 6. Snapshot the shipping address.
     *
     * Future edits to the customer's address will NOT
     * change historical order records.
     * ------------------------------------------------------
     */
    const shippingAddress =
      {
        id:
          address.id,

        label:
          address.label,

        firstName:
          address.firstName,

        lastName:
          address.lastName || '',

        phone:
          address.phone,

        addressLine1:
          address.addressLine1,

        addressLine2:
          address.addressLine2 ||
          '',

        city:
          address.city,

        state:
          address.state,

        postalCode:
          address.postalCode,

        country:
          address.country,
      };

    /*
     * ------------------------------------------------------
     * 7. Create the order.
     * ------------------------------------------------------
     */
    const orderNumber =
      createOrderNumber();

    const orderResult =
      await client.query(
        `
          INSERT INTO orders (
            order_number,
            user_id,
            customer_email,
            customer_phone,
            status,
            payment_method,
            payment_status,
            currency,
            subtotal,
            shipping_fee,
            tax_amount,
            discount_amount,
            total_amount,
            shipping_address,
            notes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'Pending',
            $5,
            'Pending',
            'INR',
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12
          )
          RETURNING
            id,
            order_number AS "orderNumber",
            user_id AS "userId",
            customer_email AS "customerEmail",
            customer_phone AS "customerPhone",
            status,
            payment_method AS "paymentMethod",
            payment_status AS "paymentStatus",
            currency,
            subtotal,
            shipping_fee AS "shippingFee",
            tax_amount AS "taxAmount",
            discount_amount AS "discountAmount",
            total_amount AS "totalAmount",
            shipping_address AS "shippingAddress",
            notes,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [
          orderNumber,

          req.user.id,

          req.user.email,

          address.phone,

          paymentMethod,

          fromPaise(
            subtotalPaise
          ),

          fromPaise(
            shippingPaise
          ),

          fromPaise(
            taxPaise
          ),

          fromPaise(
            discountPaise
          ),

          fromPaise(
            totalPaise
          ),

          JSON.stringify(
            shippingAddress
          ),

          notes || null,
        ]
      );

    const order =
      orderResult.rows[0];

    /*
     * ------------------------------------------------------
     * 8. Create order item snapshots.
     * ------------------------------------------------------
     */
    for (
      const item of orderItems
    ) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            sku,
            image_url,
            unit_price,
            quantity,
            line_total
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
        `,
        [
          order.id,

          item.productId,

          item.productName,

          item.sku,

          item.imageUrl,

          fromPaise(
            item.unitPricePaise
          ),

          item.quantity,

          fromPaise(
            item.lineTotalPaise
          ),
        ]
      );
    }

    /*
     * ------------------------------------------------------
     * 9. Create the COD payment record.
     *
     * Razorpay will use the same table later.
     * ------------------------------------------------------
     */
    await client.query(
      `
        INSERT INTO payments (
          order_id,
          provider,
          amount,
          currency,
          status
        )
        VALUES (
          $1,
          'COD',
          $2,
          'INR',
          'Pending'
        )
      `,
      [
        order.id,

        fromPaise(
          totalPaise
        ),
      ]
    );

    /*
     * ------------------------------------------------------
     * 10. Decrease inventory.
     *
     * Product rows are already locked by the SELECT above.
     * ------------------------------------------------------
     */
    for (
      const item of orderItems
    ) {
      const stockUpdate =
        await client.query(
          `
            UPDATE products
            SET
              stock_quantity =
                stock_quantity - $1,
              updated_at =
                NOW()
            WHERE id = $2
              AND stock_quantity >= $1
            RETURNING
              id,
              stock_quantity AS "stockQuantity"
          `,
          [
            item.quantity,
            item.productId,
          ]
        );

      if (
        !stockUpdate.rows.length
      ) {
        throw conflict(
          `Unable to reserve inventory for ${item.productName}`
        );
      }
    }

    /*
     * ------------------------------------------------------
     * 11. Empty the customer's cart.
     * ------------------------------------------------------
     */
    await client.query(
      `
        DELETE FROM cart_items
        WHERE cart_id = $1
      `,
      [cartId]
    );

    await client.query(
      `
        UPDATE carts
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [cartId]
    );

    /*
     * ------------------------------------------------------
     * 12. Everything succeeded.
     * ------------------------------------------------------
     */
    await client.query(
      'COMMIT'
    );

    return res.status(201).json({
      success: true,

      data: {
        order: {
          ...order,

          subtotal:
            Number(
              order.subtotal
            ),

          shippingFee:
            Number(
              order.shippingFee
            ),

          taxAmount:
            Number(
              order.taxAmount
            ),

          discountAmount:
            Number(
              order.discountAmount
            ),

          totalAmount:
            Number(
              order.totalAmount
            ),
        },
      },

      message:
        'Order created successfully',
    });
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK'
      );
    } catch {
      // Ignore rollback errors.
    }

    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  createOrder,
};

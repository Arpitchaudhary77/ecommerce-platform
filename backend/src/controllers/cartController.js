const { z } = require('zod');

const {
  pool,
  query,
} = require('../db');

const quantitySchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1)
    .max(999),
});

const addItemSchema = z.object({
  productId: z
    .string()
    .uuid(),

  quantity: z
    .number()
    .int()
    .min(1)
    .max(999),
});

function calculateTotals(items) {
  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          item.quantity,
      0
    );

  const itemCount =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= 999
        ? 0
        : 99;

  return {
    subtotal,
    itemCount,
    shipping,
    total: subtotal + shipping,
  };
}

async function ensureCart(
  userId,
  clientOrPool = pool
) {
  const result =
    await clientOrPool.query(
      `
        INSERT INTO carts (user_id)
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

async function getCart(
  req,
  res,
  next
) {
  try {
    const cartId =
      await ensureCart(
        req.user.id
      );

    const result =
      await query(
        `
          SELECT
            ci.id,
            ci.product_id AS "productId",
            ci.quantity,
            p.slug,
            p.name,
            p.brand,
            p.price,
            p.images,
            p.stock_quantity AS "stockQuantity"
          FROM cart_items ci
          INNER JOIN products p
            ON p.id = ci.product_id
          WHERE ci.cart_id = $1
            AND p.is_active = TRUE
          ORDER BY ci.created_at ASC
        `,
        [cartId]
      );

    const totals =
      calculateTotals(
        result.rows
      );

    res.json({
      success: true,
      data: {
        items: result.rows,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(
  req,
  res,
  next
) {
  const parsed =
    addItemSchema.safeParse(
      req.body
    );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid cart item',
    });
  }

  const {
    productId,
    quantity,
  } = parsed.data;

  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    const product =
      await client.query(
        `
          SELECT
            id,
            stock_quantity AS "stockQuantity",
            is_active AS "isActive"
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [productId]
      );

    if (!product.rows.length) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const productRow =
      product.rows[0];

    if (!productRow.isActive) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(400).json({
        success: false,
        message:
          'Product is no longer available',
      });
    }

    if (
      productRow.stockQuantity <
      1
    ) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(400).json({
        success: false,
        message:
          'Product is out of stock',
      });
    }

    const cartId =
      await ensureCart(
        req.user.id,
        client
      );

    const existing =
      await client.query(
        `
          SELECT quantity
          FROM cart_items
          WHERE cart_id = $1
            AND product_id = $2
          FOR UPDATE
        `,
        [
          cartId,
          productId,
        ]
      );

    if (existing.rows.length) {
      const newQuantity =
        existing.rows[0].quantity +
        quantity;

      if (
        newQuantity >
        productRow.stockQuantity
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res.status(400).json({
          success: false,
          message: `Only ${productRow.stockQuantity} units are available`,
        });
      }

      await client.query(
        `
          UPDATE cart_items
          SET
            quantity = $1,
            updated_at = NOW()
          WHERE cart_id = $2
            AND product_id = $3
        `,
        [
          newQuantity,
          cartId,
          productId,
        ]
      );
    } else {
      if (
        quantity >
        productRow.stockQuantity
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res.status(400).json({
          success: false,
          message: `Only ${productRow.stockQuantity} units are available`,
        });
      }

      await client.query(
        `
          INSERT INTO cart_items (
            cart_id,
            product_id,
            quantity
          )
          VALUES ($1, $2, $3)
        `,
        [
          cartId,
          productId,
          quantity,
        ]
      );
    }

    await client.query(
      `
        UPDATE carts
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [cartId]
    );

    await client.query('COMMIT');

    return getCart(
      req,
      res,
      next
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    next(error);
  } finally {
    client.release();
  }
}

async function updateItem(
  req,
  res,
  next
) {
  const parsed =
    quantitySchema.safeParse(
      req.body
    );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message:
        'Quantity must be a positive integer',
    });
  }

  const {
    quantity,
  } = parsed.data;

  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    const product =
      await client.query(
        `
          SELECT
            id,
            stock_quantity AS "stockQuantity",
            is_active AS "isActive"
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [req.params.productId]
      );

    if (!product.rows.length) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (
      quantity >
      product.rows[0].stockQuantity
    ) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(400).json({
        success: false,
        message: `Only ${product.rows[0].stockQuantity} units are available`,
      });
    }

    const cartId =
      await ensureCart(
        req.user.id,
        client
      );

    const result =
      await client.query(
        `
          UPDATE cart_items
          SET
            quantity = $1,
            updated_at = NOW()
          WHERE cart_id = $2
            AND product_id = $3
          RETURNING id
        `,
        [
          quantity,
          cartId,
          req.params.productId,
        ]
      );

    if (!result.rows.length) {
      await client.query(
        'ROLLBACK'
      );

      return res.status(404).json({
        success: false,
        message:
          'Product is not in your cart',
      });
    }

    await client.query(
      `
        UPDATE carts
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [cartId]
    );

    await client.query('COMMIT');

    return getCart(
      req,
      res,
      next
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    next(error);
  } finally {
    client.release();
  }
}

async function removeItem(
  req,
  res,
  next
) {
  try {
    const cartId =
      await ensureCart(
        req.user.id
      );

    await query(
      `
        DELETE FROM cart_items
        WHERE cart_id = $1
          AND product_id = $2
      `,
      [
        cartId,
        req.params.productId,
      ]
    );

    await query(
      `
        UPDATE carts
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [cartId]
    );

    return getCart(
      req,
      res,
      next
    );
  } catch (error) {
    next(error);
  }
}

async function clearCart(
  req,
  res,
  next
) {
  try {
    const cartId =
      await ensureCart(
        req.user.id
      );

    await query(
      `
        DELETE FROM cart_items
        WHERE cart_id = $1
      `,
      [cartId]
    );

    await query(
      `
        UPDATE carts
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [cartId]
    );

    return getCart(
      req,
      res,
      next
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};

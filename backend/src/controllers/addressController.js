const { z } = require('zod');

const {
  pool,
  query,
} = require('../db');

const addressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(50),

  firstName: z
    .string()
    .trim()
    .min(2)
    .max(80),

  lastName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .min(7)
    .max(30),

  addressLine1: z
    .string()
    .trim()
    .min(3)
    .max(200),

  addressLine2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .trim()
    .min(2)
    .max(100),

  state: z
    .string()
    .trim()
    .min(2)
    .max(100),

  postalCode: z
    .string()
    .trim()
    .min(3)
    .max(20),

  country: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .default('India'),

  isDefault: z
    .boolean()
    .default(false),
});

async function getAddresses(
  req,
  res,
  next
) {
  try {
    const result =
      await query(
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
            is_default AS "isDefault",
            created_at AS "createdAt"
          FROM addresses
          WHERE user_id = $1
          ORDER BY
            is_default DESC,
            created_at DESC
        `,
        [req.user.id]
      );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function createAddress(
  req,
  res,
  next
) {
  const parsed =
    addressSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address data',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const countResult =
      await client.query(
        `
          SELECT COUNT(*)::INTEGER AS count
          FROM addresses
          WHERE user_id = $1
        `,
        [req.user.id]
      );

    const isFirst =
      countResult.rows[0].count === 0;

    const shouldBeDefault =
      data.isDefault || isFirst;

    if (shouldBeDefault) {
      await client.query(
        `
          UPDATE addresses
          SET
            is_default = FALSE,
            updated_at = NOW()
          WHERE user_id = $1
        `,
        [req.user.id]
      );
    }

    const result =
      await client.query(
        `
          INSERT INTO addresses (
            user_id,
            label,
            first_name,
            last_name,
            phone,
            address_line_1,
            address_line_2,
            city,
            state,
            postal_code,
            country,
            is_default
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12
          )
          RETURNING
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
            is_default AS "isDefault",
            created_at AS "createdAt"
        `,
        [
          req.user.id,
          data.label,
          data.firstName,
          data.lastName || null,
          data.phone,
          data.addressLine1,
          data.addressLine2 || null,
          data.city,
          data.state,
          data.postalCode,
          data.country,
          shouldBeDefault,
        ]
      );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function updateAddress(
  req,
  res,
  next
) {
  const parsed =
    addressSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address data',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing =
      await client.query(
        `
          SELECT id
          FROM addresses
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [
          req.params.id,
          req.user.id,
        ]
      );

    if (!existing.rows.length) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    if (data.isDefault) {
      await client.query(
        `
          UPDATE addresses
          SET
            is_default = FALSE,
            updated_at = NOW()
          WHERE user_id = $1
        `,
        [req.user.id]
      );
    }

    const result =
      await client.query(
        `
          UPDATE addresses
          SET
            label = $1,
            first_name = $2,
            last_name = $3,
            phone = $4,
            address_line_1 = $5,
            address_line_2 = $6,
            city = $7,
            state = $8,
            postal_code = $9,
            country = $10,
            is_default = $11,
            updated_at = NOW()
          WHERE id = $12
            AND user_id = $13
          RETURNING
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
        `,
        [
          data.label,
          data.firstName,
          data.lastName || null,
          data.phone,
          data.addressLine1,
          data.addressLine2 || null,
          data.city,
          data.state,
          data.postalCode,
          data.country,
          data.isDefault,
          req.params.id,
          req.user.id,
        ]
      );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function deleteAddress(
  req,
  res,
  next
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleted =
      await client.query(
        `
          DELETE FROM addresses
          WHERE id = $1
            AND user_id = $2
          RETURNING is_default
        `,
        [
          req.params.id,
          req.user.id,
        ]
      );

    if (!deleted.rows.length) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    if (
      deleted.rows[0].is_default
    ) {
      await client.query(
        `
          UPDATE addresses
          SET
            is_default = TRUE,
            updated_at = NOW()
          WHERE id = (
            SELECT id
            FROM addresses
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          )
        `,
        [req.user.id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Address deleted',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function setDefaultAddress(
  req,
  res,
  next
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing =
      await client.query(
        `
          SELECT id
          FROM addresses
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [
          req.params.id,
          req.user.id,
        ]
      );

    if (!existing.rows.length) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    await client.query(
      `
        UPDATE addresses
        SET
          is_default = FALSE,
          updated_at = NOW()
        WHERE user_id = $1
      `,
      [req.user.id]
    );

    await client.query(
      `
        UPDATE addresses
        SET
          is_default = TRUE,
          updated_at = NOW()
        WHERE id = $1
          AND user_id = $2
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Default address updated',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

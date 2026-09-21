const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const { pool, query } = require('../db');

const registerSchema = z.object({
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

  email: z
    .string()
    .trim()
    .email()
    .max(255),

  password: z
    .string()
    .min(8)
    .max(128),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal('')),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(1)
    .max(128),
});

const profileSchema = z.object({
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
    .max(30)
    .optional()
    .or(z.literal('')),
});

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  };
}

function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure:
      process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function register(req, res, next) {
  const parsed =
    registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid registration data',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    phone,
  } = parsed.data;

  const normalizedEmail =
    email.toLowerCase();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing =
      await client.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        [normalizedEmail]
      );

    if (existing.rows.length) {
      await client.query('ROLLBACK');

      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists',
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result =
      await client.query(
        `
          INSERT INTO users (
            first_name,
            last_name,
            email,
            password_hash,
            phone
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            phone,
            role
        `,
        [
          firstName,
          lastName || null,
          normalizedEmail,
          passwordHash,
          phone || null,
        ]
      );

    await client.query('COMMIT');

    const user = result.rows[0];

    const token = signToken(user.id);

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function login(req, res, next) {
  const parsed =
    loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const {
    email,
    password,
  } = parsed.data;

  try {
    const result =
      await query(
        `
          SELECT
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            password_hash AS "passwordHash",
            phone,
            role,
            is_active AS "isActive"
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        [email.toLowerCase()]
      );

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive',
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token =
      signToken(user.id);

    setAuthCookie(res, token);

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure:
      process.env.NODE_ENV === 'production',
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
}

async function updateProfile(
  req,
  res,
  next
) {
  const parsed =
    profileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid profile data',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const {
    firstName,
    lastName,
    phone,
  } = parsed.data;

  try {
    const result =
      await query(
        `
          UPDATE users
          SET
            first_name = $1,
            last_name = $2,
            phone = $3,
            updated_at = NOW()
          WHERE id = $4
          RETURNING
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            phone,
            role
        `,
        [
          firstName,
          lastName || null,
          phone || null,
          req.user.id,
        ]
      );

    res.json({
      success: true,
      data: {
        user: sanitizeUser(
          result.rows[0]
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
};

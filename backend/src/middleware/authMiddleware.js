const jwt = require('jsonwebtoken');
const { query } = require('../db');

function getTokenFromRequest(req) {
  return req.cookies?.auth_token || null;
}

async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const result = await query(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          phone,
          role,
          is_active AS "isActive"
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [payload.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    const user = result.rows[0];

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication',
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};

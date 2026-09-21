const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const {
  checkDatabaseConnection,
} = require('./db');

const productRoutes =
  require('./routes/productRoutes');

const authRoutes =
  require('./routes/authRoutes');

const addressRoutes =
  require('./routes/addressRoutes');

const cartRoutes =
  require('./routes/cartRoutes');

const notFound =
  require('./middleware/notFound');

const errorHandler =
  require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(
  cookieParser()
);

app.get(
  '/api/health',
  async (
    req,
    res,
    next
  ) => {
    try {
      await checkDatabaseConnection();

      res.json({
        success: true,
        service:
          'ecommerce-backend',
        database:
          'connected',
        environment:
          process.env.NODE_ENV ||
          'development',
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use(
  '/api/products',
  productRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/addresses',
  addressRoutes
);

app.use(
  '/api/cart',
  cartRoutes
);

app.use(
  notFound
);

app.use(
  errorHandler
);

module.exports = app;

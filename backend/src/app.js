const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const productRoutes = require('./routes/productRoutes');
const { checkDatabaseConnection } = require('./db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res, next) => {
  try {
    await checkDatabaseConnection();

    res.json({
      success: true,
      service: 'ecommerce-backend',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

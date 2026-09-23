const express = require('express');

const {
  createOrder,
} = require('../controllers/orderController');

const {
  authenticate,
} = require('../middleware/authMiddleware');

const router =
  express.Router();

router.use(authenticate);

router.post(
  '/',
  createOrder
);

module.exports = router;

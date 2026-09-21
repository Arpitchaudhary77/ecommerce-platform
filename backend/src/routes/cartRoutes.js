const express = require('express');

const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

const {
  authenticate,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);

router.post(
  '/items',
  addItem
);

router.patch(
  '/items/:productId',
  updateItem
);

router.delete(
  '/items/:productId',
  removeItem
);

router.delete(
  '/',
  clearCart
);

module.exports = router;

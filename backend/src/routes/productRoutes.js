const express = require('express');
const {
  getProducts,
  getProductBySlug,
  getCategories,
} = require('../controllers/productController');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

module.exports = router;

const express = require('express');

const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');

const {
  authenticate,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', createAddress);

router.patch(
  '/:id',
  updateAddress
);

router.delete(
  '/:id',
  deleteAddress
);

router.post(
  '/:id/default',
  setDefaultAddress
);

module.exports = router;

const express = require('express');

const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/authController');

const {
  authenticate,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get(
  '/me',
  authenticate,
  getMe
);

router.patch(
  '/me',
  authenticate,
  updateProfile
);

module.exports = router;

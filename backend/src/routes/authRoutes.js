const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/testforgot', forgotPassword);
router.get('/me', protect, getMe);
router.post('/login', login);
router.post('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;
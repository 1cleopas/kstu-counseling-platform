const express = require('express');
const { register, login, me, updateProfile, forgotPassword, resetPassword, googleConfig, googleLogin, forgotPasswordGoogle } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/google', forgotPasswordGoogle);
router.post('/reset-password', resetPassword);
router.get('/google-config', googleConfig);
router.post('/google', googleLogin);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);

module.exports = router;

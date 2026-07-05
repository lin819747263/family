const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 认证端点限流：15分钟内最多10次尝试
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { code: 429, message: '尝试次数过多，请稍后再试' } });

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);
router.post('/family/join', authenticate, authController.joinFamily);
router.post('/family/create', authenticate, authController.createFamily);

module.exports = router;

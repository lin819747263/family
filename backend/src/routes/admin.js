const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 所有管理员路由都需要认证 + 管理员权限
router.use(authenticate, requireAdmin);

// 系统统计
router.get('/stats', ctrl.getStats);

// 用户管理
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserDetail);
router.put('/users/:id/reset-password', ctrl.resetPassword);
router.put('/users/:id/status', ctrl.updateUserStatus);

// 系统设置
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;

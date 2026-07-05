const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/familyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 家庭信息
router.get('/info', ctrl.getFamilyInfo);
router.put('/info', ctrl.updateFamilyInfo);

// 成员管理
router.get('/members', ctrl.getMembers);
router.put('/members/:id/role', ctrl.updateMemberRole);
router.delete('/members/:id', ctrl.removeMember);

// 邀请码
router.post('/invite-code', ctrl.regenerateInviteCode);

// 退出家庭
router.post('/leave', ctrl.leaveFamily);

module.exports = router;

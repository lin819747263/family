const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/investmentController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');

router.use(authenticate);

// 平台列表
router.get('/platforms', verifyFamilyAccess, ctrl.getPlatforms);

// 记录 CRUD
router.post('/', verifyFamilyAccess, ctrl.upsert);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.delete('/:id', ctrl.remove);

// 统计报表
router.get('/stats/yearly', verifyFamilyAccess, ctrl.getYearlyStats);
router.get('/stats/multi-year', verifyFamilyAccess, ctrl.getMultiYearStats);

module.exports = router;

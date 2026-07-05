const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/anniversaryController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Anniversary } = require('../models');
const { anniversaryValidators, idParam } = require('../middleware/validators');

router.use(authenticate);

const verifyAnniversaryAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Anniversary.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

// 农历转换工具（放在 /:id 之前）
router.get('/lunar-info', ctrl.getLunarInfo);
router.get('/solar-date', ctrl.getSolarDate);

router.post('/', verifyFamilyAccess, anniversaryValidators.create, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/upcoming', verifyFamilyAccess, ctrl.getUpcoming);
router.post('/trigger-reminders', verifyFamilyAccess, ctrl.triggerReminders);
router.get('/:id', verifyAnniversaryAccess, idParam, ctrl.getOne);
router.put('/:id', verifyAnniversaryAccess, idParam, ctrl.update);
router.delete('/:id', verifyAnniversaryAccess, idParam, ctrl.remove);

module.exports = router;

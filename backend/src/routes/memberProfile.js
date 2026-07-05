const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/memberProfileController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { MemberProfile } = require('../models');

router.use(authenticate);

const verifyProfileAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await MemberProfile.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/:id', verifyProfileAccess, ctrl.getOne);
router.put('/:id', verifyProfileAccess, ctrl.update);
router.delete('/:id', verifyProfileAccess, ctrl.remove);

// 体测记录（体重+身高）
router.post('/:id/record', verifyProfileAccess, ctrl.addRecord);
router.get('/:id/record', verifyProfileAccess, ctrl.getRecordHistory);
router.put('/:id/record/:type/:recordId', verifyProfileAccess, ctrl.updateRecord);
router.delete('/:id/record/:type/:recordId', verifyProfileAccess, ctrl.deleteRecord);

module.exports = router;

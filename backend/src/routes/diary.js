const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/diaryController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Diary } = require('../models');

router.use(authenticate);

const verifyDiaryAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Diary.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/:id', verifyDiaryAccess, ctrl.getOne);
router.put('/:id', verifyDiaryAccess, ctrl.update);
router.delete('/:id', verifyDiaryAccess, ctrl.remove);

module.exports = router;

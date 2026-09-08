const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funFruitController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { FunFruit } = require('../models');
const { idParam } = require('../middleware/validators');

router.use(authenticate);

const verifyAccess = verifyResourceAccess({
  getFamilyId: async (id) => { const item = await FunFruit.findByPk(id, { attributes: ['familyId'] }); return item?.familyId; }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.put('/:id', verifyAccess, idParam, ctrl.update);
router.delete('/:id', verifyAccess, idParam, ctrl.remove);

module.exports = router;

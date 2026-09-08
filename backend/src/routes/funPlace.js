const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funPlaceController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { FunPlace } = require('../models');
const { idParam } = require('../middleware/validators');

router.use(authenticate);

const verifyAccess = verifyResourceAccess({
  getFamilyId: async (id) => { const item = await FunPlace.findByPk(id, { attributes: ['familyId'] }); return item?.familyId; }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.put('/:id', verifyAccess, idParam, ctrl.update);
router.delete('/:id', verifyAccess, idParam, ctrl.remove);
router.put('/:id/wish', verifyAccess, idParam, ctrl.toggleWish);

module.exports = router;

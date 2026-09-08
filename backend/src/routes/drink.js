const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/drinkController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Drink } = require('../models');
const { idParam } = require('../middleware/validators');

router.use(authenticate);

const verifyAccess = verifyResourceAccess({
  getFamilyId: async (id) => { const item = await Drink.findByPk(id, { attributes: ['familyId'] }); return item?.familyId; }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.put('/:id', verifyAccess, idParam, ctrl.update);
router.delete('/:id', verifyAccess, idParam, ctrl.remove);
router.put('/:id/fav', verifyAccess, idParam, ctrl.toggleFav);

module.exports = router;

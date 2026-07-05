const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Wishlist } = require('../models');

router.use(authenticate);

const verifyWishlistAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Wishlist.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/:id', verifyWishlistAccess, ctrl.getOne);
router.put('/:id', verifyWishlistAccess, ctrl.update);
router.delete('/:id', verifyWishlistAccess, ctrl.remove);

module.exports = router;

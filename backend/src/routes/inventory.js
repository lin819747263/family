const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Space, Item, ItemBorrow } = require('../models');
const { inventoryValidators, idParam } = require('../middleware/validators');

router.use(authenticate);

const verifySpaceAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Space.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

const verifyItemAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Item.findByPk(id, { attributes: ['spaceId'] });
    if (!item) return null;
    const space = await Space.findByPk(item.spaceId, { attributes: ['familyId'] });
    return space?.familyId;
  }
});

const verifyBorrowAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const borrow = await ItemBorrow.findByPk(id, { attributes: ['itemId'] });
    if (!borrow) return null;
    const item = await Item.findByPk(borrow.itemId, { attributes: ['spaceId'] });
    if (!item) return null;
    const space = await Space.findByPk(item.spaceId, { attributes: ['familyId'] });
    return space?.familyId;
  }
});

// 空间
router.post('/spaces', verifyFamilyAccess, inventoryValidators.createSpace, ctrl.createSpace);
router.get('/spaces', verifyFamilyAccess, ctrl.getSpaces);
router.put('/spaces/:id', verifySpaceAccess, idParam, ctrl.updateSpace);
router.delete('/spaces/:id', verifySpaceAccess, idParam, ctrl.deleteSpace);

// 物品
router.post('/items', verifyFamilyAccess, inventoryValidators.createItem, ctrl.createItem);
router.get('/items', verifyFamilyAccess, ctrl.getItems);
router.put('/items/:id', verifyItemAccess, idParam, ctrl.updateItem);
router.delete('/items/:id', verifyItemAccess, idParam, ctrl.deleteItem);

// 借物
router.post('/borrows', verifyFamilyAccess, inventoryValidators.createBorrow, ctrl.createBorrow);
router.get('/borrows', verifyFamilyAccess, ctrl.getBorrows);
router.put('/borrows/:id/return', verifyBorrowAccess, ctrl.returnBorrow);
router.post('/borrows/:id/remind', verifyBorrowAccess, ctrl.remindBorrow);

// 分析
router.get('/unused', verifyFamilyAccess, ctrl.getUnusedItems);
router.get('/reminders', verifyFamilyAccess, ctrl.getUpcomingReminders);

module.exports = router;

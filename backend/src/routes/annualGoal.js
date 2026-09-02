const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/annualGoalController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { AnnualGoal } = require('../models');

router.use(authenticate);

const verifyGoalAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const goal = await AnnualGoal.findByPk(id, { attributes: ['familyId'] });
    return goal?.familyId;
  }
});

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/stats', verifyFamilyAccess, ctrl.getStats);
router.get('/:id', verifyGoalAccess, ctrl.getOne);
router.put('/:id', verifyGoalAccess, ctrl.update);
router.delete('/:id', verifyGoalAccess, ctrl.remove);

module.exports = router;

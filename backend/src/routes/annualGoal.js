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

// 年度目标
router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/stats', verifyFamilyAccess, ctrl.getStats);
router.get('/:id', verifyGoalAccess, ctrl.getOne);
router.put('/:id', verifyGoalAccess, ctrl.update);
router.delete('/:id', verifyGoalAccess, ctrl.remove);

// 里程碑
router.post('/:id/milestones', verifyGoalAccess, ctrl.addMilestone);
router.put('/:goalId/milestones/:id', verifyGoalAccess, ctrl.updateMilestone);
router.put('/:goalId/milestones/:id/toggle', verifyGoalAccess, ctrl.toggleMilestone);
router.delete('/:goalId/milestones/:id', verifyGoalAccess, ctrl.deleteMilestone);

module.exports = router;

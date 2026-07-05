const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/todoController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { Todo } = require('../models');
const { todoValidators, idParam } = require('../middleware/validators');

router.use(authenticate);

const verifyTodoAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Todo.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

// 统计和特殊操作（放在 /:id 之前）
router.get('/stats', verifyFamilyAccess, ctrl.getStats);
router.get('/upcoming', verifyFamilyAccess, ctrl.getUpcoming);
router.post('/archive-completed', verifyFamilyAccess, ctrl.archiveCompleted);

// CRUD
router.post('/', verifyFamilyAccess, todoValidators.create, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/:id', verifyTodoAccess, idParam, ctrl.getOne);
router.put('/:id', verifyTodoAccess, idParam, ctrl.update);
router.delete('/:id', verifyTodoAccess, idParam, ctrl.remove);

// 状态操作
router.put('/:id/toggle', verifyTodoAccess, ctrl.toggleComplete);
router.put('/:id/archive', verifyTodoAccess, ctrl.archive);
router.put('/:id/unarchive', verifyTodoAccess, ctrl.unarchive);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/habitController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');

router.use(authenticate);

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/stats', verifyFamilyAccess, ctrl.getStats);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/check', ctrl.check);
router.get('/:id/records', ctrl.getRecords);

module.exports = router;

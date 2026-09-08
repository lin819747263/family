const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/moodRecordController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');
const { idParam } = require('../middleware/validators');

router.use(authenticate);

router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.put('/:id', idParam, ctrl.update);
router.delete('/:id', idParam, ctrl.remove);

module.exports = router;

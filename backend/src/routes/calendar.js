const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/calendarController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');

router.use(authenticate);

router.get('/events', verifyFamilyAccess, ctrl.getMonthEvents);
router.get('/day', verifyFamilyAccess, ctrl.getDayEvents);

module.exports = router;

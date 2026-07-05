const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getDashboard);
router.put('/notifications/:id/read', authenticate, ctrl.markRead);
router.put('/notifications/read-all', authenticate, ctrl.markAllRead);

module.exports = router;

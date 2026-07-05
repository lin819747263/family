const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/chat', ctrl.chat);
router.post('/chat/stream', ctrl.chatStream);

module.exports = router;

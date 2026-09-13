const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createUploader } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

const upload = createUploader('photos');

router.post('/', authenticate, upload.single('file'), uploadController.upload);
router.get('/config', authenticate, uploadController.getConfig);

module.exports = router;

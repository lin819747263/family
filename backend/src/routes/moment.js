const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/momentController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');
const { Moment } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const oss = require('../utils/oss');

router.use(authenticate);

const verifyMomentAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Moment.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

// 通用图片上传（不依赖相册）
const upload = createUploader('moments');
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });

    const config = await oss.getOSSConfig();

    if (config.oss_enabled === 'true') {
      const ext = path.extname(req.file.originalname);
      const filename = `${uuidv4()}${ext}`;
      const buffer = fs.readFileSync(req.file.path);
      const result = await oss.uploadBuffer(buffer, filename, { dir: 'moments' });
      fs.unlink(req.file.path, () => {});
      return res.json({ code: 0, data: { url: result.url } });
    }

    res.json({ code: 0, data: { url: `/uploads/moments/${req.file.filename}` } });
  } catch (err) { next(err); }
});

// 瞬间
router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);

// 评论（放在 /:id 之前，避免被通配符捕获）
router.post('/comments', verifyFamilyAccess, ctrl.addComment);
router.get('/comments', verifyFamilyAccess, ctrl.getComments);

// 瞬间详情/删除/点赞
router.get('/:id', verifyMomentAccess, ctrl.getOne);
router.delete('/:id', verifyMomentAccess, ctrl.remove);
router.post('/:id/like', verifyMomentAccess, ctrl.toggleLike);

module.exports = router;

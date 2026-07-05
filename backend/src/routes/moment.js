const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/momentController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');
const { Moment } = require('../models');

router.use(authenticate);

const verifyMomentAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Moment.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

// 通用图片上传（不依赖相册）
const upload = createUploader('moments');
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });
  res.json({ code: 0, data: { url: `/uploads/moments/${req.file.filename}` } });
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

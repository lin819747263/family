const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recipeController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');
const { Recipe } = require('../models');

router.use(authenticate);

const verifyRecipeAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const item = await Recipe.findByPk(id, { attributes: ['familyId'] });
    return item?.familyId;
  }
});

// 图片上传
const upload = createUploader('recipes');
router.post('/upload', verifyFamilyAccess, upload.single('file'), ctrl.uploadImage);

// 随机推荐（放在 /:id 之前）
router.get('/random', verifyFamilyAccess, ctrl.random);

// CRUD
router.post('/', verifyFamilyAccess, ctrl.create);
router.get('/', verifyFamilyAccess, ctrl.getList);
router.get('/:id', verifyRecipeAccess, ctrl.getOne);
router.put('/:id', verifyRecipeAccess, ctrl.update);
router.delete('/:id', verifyRecipeAccess, ctrl.remove);

module.exports = router;

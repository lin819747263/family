const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/albumController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess, verifyResourceAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');
const { Album, Photo } = require('../models');
const { albumValidators, idParam } = require('../middleware/validators');

router.use(authenticate);

const upload = createUploader('photos');

const verifyAlbumAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const album = await Album.findByPk(id, { attributes: ['familyId'] });
    return album?.familyId;
  }
});

const verifyPhotoAccess = verifyResourceAccess({
  getFamilyId: async (id) => {
    const photo = await Photo.findByPk(id, { attributes: ['albumId'] });
    if (!photo) return null;
    const album = await Album.findByPk(photo.albumId, { attributes: ['familyId'] });
    return album?.familyId;
  }
});

// 相册
router.post('/albums', verifyFamilyAccess, albumValidators.createAlbum, ctrl.createAlbum);
router.get('/albums', verifyFamilyAccess, ctrl.getAlbums);
router.post('/albums/:id/verify', verifyAlbumAccess, ctrl.verifyAlbumPassword);
router.put('/albums/:id', verifyAlbumAccess, idParam, ctrl.updateAlbum);
router.delete('/albums/:id', verifyAlbumAccess, idParam, ctrl.deleteAlbum);

// 照片（multer 必须在 verifyFamilyAccess 之前，否则 req.body.albumId 未定义）
router.post('/photos/upload', upload.single('file'), verifyFamilyAccess, ctrl.uploadPhoto);
router.get('/photos', verifyFamilyAccess, ctrl.getPhotos);
router.delete('/photos/:id', verifyPhotoAccess, ctrl.deletePhoto);

// 共享
router.post('/albums/:id/share', verifyAlbumAccess, ctrl.shareAlbum);
router.get('/albums/:id/shares', verifyAlbumAccess, ctrl.getAlbumShares);

// 评论
router.post('/comments', verifyFamilyAccess, albumValidators.addComment, ctrl.addComment);
router.get('/comments', verifyFamilyAccess, ctrl.getComments);

// 点赞
router.post('/photos/:photoId/like', verifyPhotoAccess, ctrl.toggleLike);

// 存储空间
router.get('/storage', verifyFamilyAccess, ctrl.getStorageInfo);

// 回忆
router.get('/memories', verifyFamilyAccess, ctrl.getMemories);

// 时光轴
router.get('/timeline', verifyFamilyAccess, ctrl.getTimeline);

module.exports = router;

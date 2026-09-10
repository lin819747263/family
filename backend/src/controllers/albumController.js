const { Album, Photo, AlbumShare, PhotoComment, StorageSpace, User, FamilyMember } = require('../models');
const { Op, fn, col } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { encrypt, decrypt } = require('../utils/encrypt');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

dayjs.extend(utc);

// ===== 相册管理 =====
exports.createAlbum = async (req, res, next) => {
  try {
    const { name, type, password, description } = req.body;
    let hashedPwd = null;
    if (type === 'encrypted' && password) hashedPwd = await bcrypt.hash(password, 10);
    const album = await Album.create({ name, description, type: type || 'normal', password: hashedPwd, familyId: req.body.familyId, createdBy: req.userId });
    res.status(201).json({ code: 0, data: album, message: '相册创建成功' });
  } catch (err) { next(err); }
};

exports.getAlbums = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const albums = await Album.findAll({
      where: { familyId, status: 'active' },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
        { model: Photo, attributes: ['id', 'thumbnailUrl'], separate: true, limit: 4, order: [['created_at', 'DESC']] }
      ],
      order: [['sort', 'ASC'], ['created_at', 'DESC']]
    });

    // 批量获取照片计数，避免 N+1 查询
    if (albums.length > 0) {
      const albumIds = albums.map(a => a.id);
      const counts = await Photo.findAll({
        attributes: ['albumId', [Photo.sequelize.fn('COUNT', Photo.sequelize.col('id')), 'count']],
        where: { albumId: { [Op.in]: albumIds }, isDeleted: false },
        group: ['albumId'],
        raw: true
      });
      const countMap = Object.fromEntries(counts.map(c => [c.albumId, parseInt(c.count)]));
      for (const a of albums) {
        a.dataValues.photoCount = countMap[a.id] || 0;
        a.dataValues.password = !!a.dataValues.password;
      }
    }

    res.json({ code: 0, data: albums });
  } catch (err) { next(err); }
};

exports.verifyAlbumPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const album = await Album.findByPk(id);
    if (!album || album.type !== 'encrypted' || !album.password) return res.status(400).json({ code: 400, message: '不需要密码' });
    const valid = await bcrypt.compare(password, album.password);
    if (!valid) return res.status(403).json({ code: 403, message: '密码错误' });
    const token = jwt.sign({ albumId: parseInt(id), userId: req.userId }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ code: 0, data: { verified: true, token }, message: '验证通过' });
  } catch (err) { next(err); }
};

exports.updateAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = (({ name, description }) => ({ name, description }))(req.body);
    await Album.update(allowed, { where: { id, createdBy: req.userId } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Album.update({ status: 'archived' }, { where: { id, createdBy: req.userId } });
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { next(err); }
};

// ===== 照片管理 =====
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, message: '请选择图片' });
    const { albumId } = req.body;
    const album = await Album.findByPk(albumId);
    if (!album) return res.status(404).json({ code: 404, message: '相册不存在' });
    const filePath = req.file.path;
    const metadata = await sharp(filePath).metadata();
    const thumbName = `thumb_${req.file.filename}`;
    const thumbPath = path.join(path.dirname(filePath), thumbName);
    await sharp(filePath).resize(400, 400, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(thumbPath);
    let isEncrypted = album.type === 'encrypted';
    let finalUrl = `/uploads/photos/${req.file.filename}`;
    if (isEncrypted) {
      const buf = fs.readFileSync(filePath);
      const encBuf = Buffer.from(encrypt(buf.toString('base64')), 'base64');
      fs.writeFileSync(filePath, encBuf);
    }
    const photo = await Photo.create({
      albumId, originalName: req.file.originalname, url: finalUrl,
      thumbnailUrl: `/uploads/photos/${thumbName}`,
      width: metadata.width, height: metadata.height, size: req.file.size,
      mimeType: req.file.mimetype, uploadedBy: req.userId,
      isEncrypted
    });
    await updateStorageUsed(req.userId, req.file.size);
    res.status(201).json({ code: 0, data: photo, message: '上传成功' });
  } catch (err) { next(err); }
};

exports.getPhotos = async (req, res, next) => {
  try {
    const { albumId, page = 1, pageSize = 30 } = req.query;
    const { count, rows } = await Photo.findAndCountAll({
      where: { albumId, isDeleted: false },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['taken_at', 'DESC'], ['created_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const photo = await Photo.findByPk(id);
    if (!photo) return res.status(404).json({ code: 404, message: '照片不存在' });
    await photo.update({ isDeleted: true });
    // 减少存储空间
    await StorageSpace.increment({ usedBytes: -photo.size }, { where: { userId: photo.uploadedBy } });
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { next(err); }
};

// ===== 相册共享 =====
exports.shareAlbum = async (req, res, next) => {
  try {
    const { id: albumId } = req.params;
    const { sharedWith, permission } = req.body;
    // 验证当前用户是相册创建者或家庭成员
    const album = await Album.findByPk(albumId);
    if (!album) return res.status(404).json({ code: 404, message: '相册不存在' });
    if (album.createdBy !== req.userId) {
      const membership = await FamilyMember.findOne({ where: { familyId: album.familyId, userId: req.userId } });
      if (!membership) return res.status(403).json({ code: 403, message: '无权共享该相册' });
    }
    const share = await AlbumShare.create({ albumId, sharedWith, permission: permission || 'view' });
    res.status(201).json({ code: 0, data: share, message: '共享成功' });
  } catch (err) { next(err); }
};

exports.getAlbumShares = async (req, res, next) => {
  try {
    const { id: albumId } = req.params;
    const shares = await AlbumShare.findAll({ where: { albumId }, include: [{ model: User, as: 'sharedUser', attributes: ['id', 'nickname', 'avatar'] }] });
    res.json({ code: 0, data: shares });
  } catch (err) { next(err); }
};

// ===== 评论 =====
exports.addComment = async (req, res, next) => {
  try {
    const { photoId, content } = req.body;
    const comment = await PhotoComment.create({ photoId, userId: req.userId, content });
    const commentWithUser = await PhotoComment.findByPk(comment.id, { include: [{ model: User, attributes: ['id', 'nickname', 'avatar'] }] });
    res.status(201).json({ code: 0, data: commentWithUser, message: '评论成功' });
  } catch (err) { next(err); }
};

exports.getComments = async (req, res, next) => {
  try {
    const { photoId } = req.query;
    const comments = await PhotoComment.findAll({
      where: { photoId }, include: [{ model: User, attributes: ['id', 'nickname', 'avatar'] }], order: [['created_at', 'ASC']]
    });
    res.json({ code: 0, data: comments });
  } catch (err) { next(err); }
};

// ===== 点赞 =====
exports.toggleLike = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const photo = await Photo.findByPk(photoId);
    if (!photo) return res.status(404).json({ code: 404, message: '照片不存在' });
    const existing = await photo.hasLikedBy(req.userId);
    if (existing) { await photo.removeLikedBy(req.userId); return res.json({ code: 0, data: { liked: false }, message: '已取消点赞' }); }
    await photo.addLikedBy(req.userId);
    res.json({ code: 0, data: { liked: true }, message: '点赞成功' });
  } catch (err) { next(err); }
};

// ===== 存储空间 =====
exports.getStorageInfo = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const spaces = await StorageSpace.findAll({
      where: { familyId }, include: [{ model: User, attributes: ['id', 'nickname', 'avatar'] }]
    });
    const totalUsed = spaces.reduce((sum, s) => sum + parseInt(s.usedBytes || 0), 0);
    const totalLimit = spaces.reduce((sum, s) => sum + parseInt(s.totalBytes || 0), 0);
    res.json({ code: 0, data: { spaces, totalUsed, totalLimit, percent: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0 } });
  } catch (err) { next(err); }
};

// ===== 回忆推送 =====
exports.getMemories = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const today = new Date();
    const lastYear = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const lastWeekEnd = today.toISOString().slice(0, 10);
    const lastWeekStart = new Date(today - 7 * 86400000).toISOString().slice(0, 10);
    const memories = {};
    // N年前的今天
    const yearAgo = await Photo.findAll({
      where: { created_at: { [Op.like]: `${lastYear}%` }, isDeleted: false },
      include: [{ model: Album, where: { familyId } }],
      limit: 10
    });
    if (yearAgo.length) memories.yearAgo = yearAgo;
    // 本周最佳
    const weekBest = await Photo.findAll({
      where: { created_at: { [Op.between]: [lastWeekStart, lastWeekEnd] }, isDeleted: false },
      include: [{ model: Album, where: { familyId } }],
      order: [['created_at', 'DESC']], limit: 6
    });
    if (weekBest.length) memories.weekBest = weekBest;
    res.json({ code: 0, data: memories });
  } catch (err) { next(err); }
};

// ===== 时光轴 =====
function utcToLocalDate(utcDate) {
  return dayjs(utcDate).utcOffset(8).format('YYYY-MM-DD');
}

exports.getTimeline = async (req, res, next) => {
  try {
    const { familyId, year, month, page = 1, pageSize = 50 } = req.query;
    // 查找家庭所有相册
    const albums = await Album.findAll({ where: { familyId, status: 'active' }, attributes: ['id'] });
    const albumIds = albums.map(a => a.id);
    if (albumIds.length === 0) return res.json({ code: 0, data: { years: [], photos: [], total: 0 } });

    // 获取所有可用年份（用于年份筛选，按北京时间）
    const yearRows = await Photo.findAll({
      where: { albumId: { [Op.in]: albumIds }, isDeleted: false },
      attributes: [[fn('YEAR', fn('CONVERT_TZ', col('created_at'), '+00:00', '+08:00')), 'year']],
      group: ['year'],
      raw: true
    });
    const years = yearRows.map(r => r.year).filter(Boolean).sort((a, b) => b - a);

    // 构建查询条件
    const where = { albumId: { [Op.in]: albumIds }, isDeleted: false };
    if (year) {
      // 北京时间范围：UTC 时间需要减 8 小时
      const startMonth = month ? String(month).padStart(2, '0') : '01';
      const endMonth = month ? String(month).padStart(2, '0') : '12';
      const startDate = `${year}-${startMonth}-01T00:00:00+08:00`;
      const endYear = month ? parseInt(year) : parseInt(year) + 1;
      const endMonthNum = month ? parseInt(month) + 1 : 1;
      const endDate = `${endYear}-${String(endMonthNum).padStart(2, '0')}-01T00:00:00+08:00`;
      where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
    }

    // 分页查询照片
    const { count, rows } = await Photo.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    // 按北京时间分组
    const grouped = {};
    rows.forEach(p => {
      const date = utcToLocalDate(p.createdAt);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(p);
    });
    const photos = Object.entries(grouped).map(([date, items]) => ({ date, items }));

    res.json({ code: 0, data: { years, photos, total: count } });
  } catch (err) { next(err); }
};

async function updateStorageUsed(userId, size) {
  const space = await StorageSpace.findOne({ where: { userId } });
  if (space) { space.usedBytes = parseInt(space.usedBytes) + size; await space.save(); }
}

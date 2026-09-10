const { FamilyMember } = require('../models');
const NodeCache = require('node-cache');

// 家庭成员身份缓存：TTL 5分钟，每60秒清理
const memberCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * 验证当前用户是否属于目标家庭
 * 优先从 req.query.familyId / req.body.familyId 获取
 * 若无则尝试从 req.query.spaceId 反查 familyId
 */
const verifyFamilyAccess = async (req, res, next) => {
  try {
    let familyId = req.query.familyId || req.body.familyId;

    // 如果没有 familyId 但有 spaceId，从空间反查
    if (!familyId && (req.query.spaceId || req.body.spaceId)) {
      const { Space } = require('../models');
      const spaceId = req.query.spaceId || req.body.spaceId;
      const space = await Space.findByPk(spaceId, { attributes: ['familyId'] });
      if (space) familyId = space.familyId;
    }

    // 如果没有 familyId 但有 albumId，从相册反查
    if (!familyId && (req.query.albumId || req.body.albumId)) {
      const { Album } = require('../models');
      const albumId = req.query.albumId || req.body.albumId;
      const album = await Album.findByPk(albumId, { attributes: ['familyId'] });
      if (album) familyId = album.familyId;
    }

    if (!familyId) {
      return res.status(400).json({ code: 400, message: '缺少 familyId 参数' });
    }

    const fid = parseInt(familyId);
    const cacheKey = `${req.userId}:${fid}`;

    // 先查缓存
    let member = memberCache.get(cacheKey);
    if (!member) {
      member = await FamilyMember.findOne({
        where: { familyId: fid, userId: req.userId }
      });
      if (member) memberCache.set(cacheKey, member.toJSON ? member.toJSON() : member);
    }

    if (!member) {
      return res.status(403).json({ code: 403, message: '无权访问该家庭' });
    }
    req.familyMember = member;
    req.resourceFamilyId = fid;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 创建资源级家庭权限校验中间件
 * 通过 req.params.id 查找资源，验证其 familyId 是否属于当前用户
 * @param {Object} options
 * @param {Function} options.getFamilyId - async (id) => familyId，从资源 ID 获取 familyId
 */
function verifyResourceAccess({ getFamilyId }) {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.photoId;
      if (!resourceId) {
        return res.status(400).json({ code: 400, message: '缺少资源 ID' });
      }

      const familyId = await getFamilyId(resourceId);
      if (!familyId) {
        return res.status(404).json({ code: 404, message: '资源不存在' });
      }

      const member = await FamilyMember.findOne({
        where: { familyId: parseInt(familyId), userId: req.userId }
      });
      if (!member) {
        return res.status(403).json({ code: 403, message: '无权访问该资源' });
      }

      req.familyMember = member;
      req.resourceFamilyId = familyId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { verifyFamilyAccess, verifyResourceAccess };

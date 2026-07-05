const { Moment, MomentComment, MomentLike, User } = require('../models');
const { Op } = require('sequelize');

// 创建瞬间
exports.create = async (req, res, next) => {
  try {
    const { content, images, location, mood, familyId } = req.body;
    if (!content && (!images || images.length === 0)) {
      return res.status(400).json({ code: 400, message: '请输入文字或上传图片' });
    }
    const moment = await Moment.create({
      familyId,
      userId: req.userId,
      content: content || '',
      images: images ? JSON.stringify(images) : '[]',
      location: location || '',
      mood: mood || ''
    });
    // 返回时带上作者信息
    const result = await Moment.findByPk(moment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }]
    });
    res.status(201).json({ code: 0, data: result, message: '发布成功' });
  } catch (err) { next(err); }
};

// 获取瞬间列表（分页）
exports.getList = async (req, res, next) => {
  try {
    const { familyId, page = 1, pageSize = 20 } = req.query;
    const where = { familyId, status: 'active' };
    const { count, rows } = await Moment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });
    // 查询当前用户的点赞记录
    const momentIds = rows.map(r => r.id);
    const userLikes = await MomentLike.findAll({
      where: { momentId: momentIds, userId: req.userId },
      attributes: ['momentId'],
      raw: true
    });
    const likedSet = new Set(userLikes.map(l => l.momentId));
    // 解析 images JSON
    const list = rows.map(r => {
      const json = r.toJSON()
      try { json.images = JSON.parse(json.images || '[]') } catch { json.images = [] }
      json.liked = likedSet.has(json.id)
      return json
    })
    res.json({ code: 0, data: { list, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

// 获取单条详情
exports.getOne = async (req, res, next) => {
  try {
    const moment = await Moment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] },
        {
          model: MomentComment,
          include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });
    if (!moment || moment.status === 'deleted') {
      return res.status(404).json({ code: 404, message: '瞬间不存在' });
    }
    const json = moment.toJSON()
    try { json.images = JSON.parse(json.images || '[]') } catch { json.images = [] }
    res.json({ code: 0, data: json });
  } catch (err) { next(err); }
};

// 删除瞬间（软删除）
exports.remove = async (req, res, next) => {
  try {
    const moment = await Moment.findByPk(req.params.id);
    if (!moment) return res.status(404).json({ code: 404, message: '瞬间不存在' });
    if (moment.userId !== req.userId) return res.status(403).json({ code: 403, message: '只能删除自己发布的瞬间' });
    await moment.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// 点赞/取消点赞
exports.toggleLike = async (req, res, next) => {
  try {
    const moment = await Moment.findByPk(req.params.id);
    if (!moment || moment.status === 'deleted') {
      return res.status(404).json({ code: 404, message: '瞬间不存在' });
    }
    const existing = await MomentLike.findOne({ where: { momentId: moment.id, userId: req.userId } });
    if (existing) {
      // 取消点赞
      await existing.destroy();
      await moment.decrement('likeCount');
      res.json({ code: 0, data: { likeCount: Math.max(0, moment.likeCount - 1), liked: false }, message: '已取消点赞' });
    } else {
      // 点赞
      await MomentLike.create({ momentId: moment.id, userId: req.userId });
      await moment.increment('likeCount');
      res.json({ code: 0, data: { likeCount: moment.likeCount + 1, liked: true }, message: '已点赞' });
    }
  } catch (err) { next(err); }
};

// 添加评论
exports.addComment = async (req, res, next) => {
  try {
    const { momentId, content } = req.body;
    if (!content) return res.status(400).json({ code: 400, message: '请输入评论内容' });
    const moment = await Moment.findByPk(momentId);
    if (!moment || moment.status === 'deleted') {
      return res.status(404).json({ code: 404, message: '瞬间不存在' });
    }
    const comment = await MomentComment.create({ momentId, userId: req.userId, content });
    await moment.increment('commentCount');
    // 返回评论带作者信息
    const result = await MomentComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }]
    });
    res.status(201).json({ code: 0, data: result, message: '评论成功' });
  } catch (err) { next(err); }
};

// 获取评论列表
exports.getComments = async (req, res, next) => {
  try {
    const { momentId } = req.query;
    const comments = await MomentComment.findAll({
      where: { momentId },
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'ASC']]
    });
    res.json({ code: 0, data: comments });
  } catch (err) { next(err); }
};

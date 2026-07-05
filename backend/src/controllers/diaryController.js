const { Diary, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const allowed = (({ title, content, mood, weather, isPublic }) => ({ title, content, mood, weather, isPublic }))(req.body);
    if (!allowed.title) return res.status(400).json({ code: 400, message: '请输入日记标题' });
    if (!allowed.content) return res.status(400).json({ code: 400, message: '请输入日记内容' });
    const item = await Diary.create({
      ...allowed,
      familyId: req.body.familyId,
      createdBy: req.userId
    });
    const result = await Diary.findByPk(item.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    res.status(201).json({ code: 0, data: result, message: '发表成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, page = 1, pageSize = 20, keyword } = req.query;
    const where = { familyId, status: { [Op.ne]: 'deleted' } };
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Diary.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Diary.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '日记不存在' });
    res.json({ code: 0, data: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Diary.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '日记不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能编辑自己的日记' });
    const allowed = (({ title, content, mood, weather, isPublic }) => ({ title, content, mood, weather, isPublic }))(req.body);
    await item.update(allowed);
    const result = await Diary.findByPk(item.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    res.json({ code: 0, data: result, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Diary.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '日记不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能删除自己的日记' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

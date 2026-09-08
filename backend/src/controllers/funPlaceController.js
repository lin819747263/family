const { FunPlace, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { name, description, season, distance, duration, fee, tags } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入景点名称' });
    const item = await FunPlace.create({
      name, description, season: season || 'all', distance, duration, fee,
      tags: tags || [],
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '添加成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, keyword, season, wish, page = 1, pageSize = 20 } = req.query;
    const where = { familyId, status: 'active' };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (season && season !== 'all') where[Op.or] = [{ season }, { season: 'all' }];
    if (wish === '1') where.isWish = true;

    const { count, rows } = await FunPlace.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await FunPlace.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '景点不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '无权修改' });
    const allowed = (({ name, description, season, distance, duration, fee, tags }) => ({ name, description, season, distance, duration, fee, tags }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await FunPlace.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '景点不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

exports.toggleWish = async (req, res, next) => {
  try {
    const item = await FunPlace.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '景点不存在' });
    item.isWish = !item.isWish;
    await item.save();
    res.json({ code: 0, data: { isWish: item.isWish } });
  } catch (err) { next(err); }
};

const { FunFruit, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { name, emoji, seasonFrom, seasonTo, sweetness, price, tip } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入水果名称' });
    const item = await FunFruit.create({
      name, emoji, seasonFrom, seasonTo, sweetness: sweetness || 3, price, tip,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '添加成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, keyword, month, page = 1, pageSize = 50 } = req.query;
    const where = { familyId, status: 'active' };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (month) {
      const m = parseInt(month);
      where[Op.and] = [
        { seasonFrom: { [Op.lte]: m } },
        { seasonTo: { [Op.gte]: m } }
      ];
    }

    const { count, rows } = await FunFruit.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['season_from', 'ASC'], ['created_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await FunFruit.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '水果不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '无权修改' });
    const allowed = (({ name, emoji, seasonFrom, seasonTo, sweetness, price, tip }) => ({ name, emoji, seasonFrom, seasonTo, sweetness, price, tip }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await FunFruit.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '水果不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

const { Drink, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { name, brand, tags, sugar, ice, note } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入饮品名称' });
    const item = await Drink.create({
      name, brand, tags: tags || [], sugar, ice, note,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '收藏成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, keyword, fav, page = 1, pageSize = 20 } = req.query;
    const where = { familyId, status: 'active' };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (fav === '1') where.isFav = true;

    const { count, rows } = await Drink.findAndCountAll({
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
    const item = await Drink.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '饮品不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '无权修改' });
    const allowed = (({ name, brand, tags, sugar, ice, note }) => ({ name, brand, tags, sugar, ice, note }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Drink.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '饮品不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

exports.toggleFav = async (req, res, next) => {
  try {
    const item = await Drink.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '饮品不存在' });
    item.isFav = !item.isFav;
    item.likes = item.isFav ? item.likes + 1 : Math.max(0, item.likes - 1);
    await item.save();
    res.json({ code: 0, data: { isFav: item.isFav, likes: item.likes } });
  } catch (err) { next(err); }
};

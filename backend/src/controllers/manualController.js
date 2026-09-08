const { Manual } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

exports.create = async (req, res, next) => {
  try {
    const { name, modelNo, category, purchaseDate, warrantyMonths } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入物品名称' });
    let warrantyEnd = null;
    if (purchaseDate && warrantyMonths) {
      warrantyEnd = dayjs(purchaseDate).add(parseInt(warrantyMonths), 'month').format('YYYY-MM-DD');
    }
    const item = await Manual.create({
      name, modelNo, category, purchaseDate, warrantyMonths: warrantyMonths || 0, warrantyEnd,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '归档成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, keyword, category } = req.query;
    const where = { familyId, status: 'active' };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (category && category !== 'all') where.category = category;
    const items = await Manual.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Manual.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '记录不存在' });
    const allowed = (({ name, modelNo, category, purchaseDate, warrantyMonths }) => {
      let warrantyEnd = item.warrantyEnd;
      if (purchaseDate && warrantyMonths) {
        warrantyEnd = dayjs(purchaseDate).add(parseInt(warrantyMonths), 'month').format('YYYY-MM-DD');
      }
      return { name, modelNo, category, purchaseDate, warrantyMonths, warrantyEnd };
    })(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Manual.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '记录不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

const { Wishlist, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const allowed = (({ title, description, imageUrl, price, priority }) => ({ title, description, imageUrl, price, priority }))(req.body);
    if (!allowed.title) return res.status(400).json({ code: 400, message: '请输入心愿标题' });
    const item = await Wishlist.create({
      ...allowed,
      familyId: req.body.familyId,
      createdBy: req.userId,
      status: 'pending'
    });
    res.status(201).json({ code: 0, data: item, message: '许愿成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, status } = req.query;
    const where = { familyId };
    if (status) where.status = status;
    else where.status = { [Op.ne]: 'deleted' };
    const items = await Wishlist.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['status', 'ASC'], ['priority', 'DESC'], ['created_at', 'DESC']]
    });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Wishlist.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!item) return res.status(404).json({ code: 404, message: '心愿不存在' });
    res.json({ code: 0, data: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Wishlist.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '心愿不存在' });
    const allowed = (({ title, description, imageUrl, price, priority, status, fulfilledAt }) => ({ title, description, imageUrl, price, priority, status, fulfilledAt }))(req.body);
    // 如果标记为已实现，自动设置实现日期
    if (allowed.status === 'fulfilled' && !allowed.fulfilledAt) {
      allowed.fulfilledAt = new Date().toISOString().slice(0, 10);
    }
    await item.update(allowed);
    res.json({ code: 0, data: item, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Wishlist.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '心愿不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

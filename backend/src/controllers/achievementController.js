const { Achievement, MemberProfile } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { profileId, title, description, icon, category, achievedDate, isGold } = req.body;
    if (!title) return res.status(400).json({ code: 400, message: '请输入成就标题' });
    const item = await Achievement.create({
      profileId, title, description, icon: icon || '🎉', category, achievedDate, isGold: isGold || false,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '添加成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, profileId, year } = req.query;
    const where = { familyId, status: 'active' };
    if (profileId) where.profileId = profileId;
    if (year) where.achievedDate = { [Op.like]: `${year}%` };
    const items = await Achievement.findAll({
      where,
      include: [{ model: MemberProfile, as: 'profile', attributes: ['id', 'name', 'nickname'] }],
      order: [['achieved_date', 'DESC']]
    });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Achievement.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '成就不存在' });
    const allowed = (({ profileId, title, description, icon, category, achievedDate, isGold }) =>
      ({ profileId, title, description, icon, category, achievedDate, isGold }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Achievement.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '成就不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

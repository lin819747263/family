const { TimelineEvent, MemberProfile } = require('../models');

exports.create = async (req, res, next) => {
  try {
    const { profileId, year, month, title, description, icon, eventType } = req.body;
    if (!year || !title) return res.status(400).json({ code: 400, message: '年份和标题不能为空' });
    const item = await TimelineEvent.create({
      profileId, year, month, title, description, icon: icon || '🎉', eventType,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '添加成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, profileId } = req.query;
    const where = { familyId, status: 'active' };
    if (profileId) where.profileId = profileId;
    const items = await TimelineEvent.findAll({
      where,
      include: [{ model: MemberProfile, as: 'profile', attributes: ['id', 'name', 'nickname'] }],
      order: [['year', 'ASC'], ['month', 'ASC']]
    });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await TimelineEvent.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '事件不存在' });
    const allowed = (({ profileId, year, month, title, description, icon, eventType }) =>
      ({ profileId, year, month, title, description, icon, eventType }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await TimelineEvent.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '事件不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

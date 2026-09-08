const { MoodRecord, MemberProfile } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { profileId, moodIndex, score, tags, note, recordDate } = req.body;
    if (!recordDate) return res.status(400).json({ code: 400, message: '请选择日期' });
    const item = await MoodRecord.create({
      profileId, moodIndex, score, tags: tags || [], note, recordDate,
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '打卡成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const items = await MoodRecord.findAll({
      where: { familyId, recordDate: { [Op.gte]: startDate.toISOString().split('T')[0] } },
      include: [{ model: MemberProfile, as: 'profile', attributes: ['id', 'name', 'nickname'] }],
      order: [['record_date', 'ASC']]
    });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await MoodRecord.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '记录不存在' });
    const allowed = (({ moodIndex, score, tags, note }) => ({ moodIndex, score, tags, note }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await MoodRecord.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '记录不存在' });
    await item.destroy();
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

const { Pet } = require('../models');

exports.create = async (req, res, next) => {
  try {
    const { name, emoji, breed, gender, birthday, weight, weightChange, pills, loves, hates, photos } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入宠物名' });
    const item = await Pet.create({
      name, emoji, breed, gender, birthday, weight, weightChange,
      pills: pills || [], loves: loves || [], hates: hates || [], photos: photos || [],
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '添加成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const items = await Pet.findAll({ where: { familyId, status: 'active' }, order: [['created_at', 'ASC']] });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Pet.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '宠物不存在' });
    const allowed = (({ name, emoji, breed, gender, birthday, weight, weightChange, pills, loves, hates, photos }) =>
      ({ name, emoji, breed, gender, birthday, weight, weightChange, pills, loves, hates, photos }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Pet.findByPk(req.params.id);
    if (!item) return res.status(404).json({ code: 404, message: '宠物不存在' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

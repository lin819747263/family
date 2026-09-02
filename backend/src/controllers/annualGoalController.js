const { AnnualGoal, User } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const allowed = (({ year, title, description, category, taskType }) => ({ year, title, description, category, taskType }))(req.body);
    if (!allowed.title) return res.status(400).json({ code: 400, message: '请输入目标标题' });
    if (!allowed.year) return res.status(400).json({ code: 400, message: '请选择年份' });
    const goal = await AnnualGoal.create({
      ...allowed,
      familyId: req.body.familyId,
      createdBy: req.userId,
      status: 'active',
      progress: 0,
      q1Progress: 0,
      q2Progress: 0,
      q3Progress: 0,
      q4Progress: 0
    });
    res.status(201).json({ code: 0, data: goal, message: '目标创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, year, status, category } = req.query;
    const where = { familyId };
    if (year) where.year = parseInt(year);
    if (status) where.status = status;
    else where.status = { [Op.ne]: 'deleted' };
    if (category) where.category = category;
    const goals = await AnnualGoal.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['status', 'ASC'], ['category', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ code: 0, data: goals });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const goal = await AnnualGoal.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    res.json({ code: 0, data: goal });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const goal = await AnnualGoal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    const allowed = (({ title, description, category, taskType, progress, q1Progress, q2Progress, q3Progress, q4Progress, status }) => ({ title, description, category, taskType, progress, q1Progress, q2Progress, q3Progress, q4Progress, status }))(req.body);
    // 如果标记为完成，自动设置完成日期和进度100%
    if (allowed.status === 'completed' && goal.status !== 'completed') {
      allowed.completedAt = new Date().toISOString().slice(0, 10);
      allowed.progress = 100;
    }
    await goal.update(allowed);
    res.json({ code: 0, data: goal, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const goal = await AnnualGoal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    await goal.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const { familyId, year } = req.query;
    const where = { familyId, status: { [Op.ne]: 'deleted' } };
    if (year) where.year = parseInt(year);
    const goals = await AnnualGoal.findAll({ where });
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const active = goals.filter(g => g.status === 'active').length;
    const cancelled = goals.filter(g => g.status === 'cancelled').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    // 分类统计
    const categoryStats = {};
    goals.forEach(g => {
      if (!categoryStats[g.category]) categoryStats[g.category] = { total: 0, completed: 0 };
      categoryStats[g.category].total++;
      if (g.status === 'completed') categoryStats[g.category].completed++;
    });
    res.json({ code: 0, data: { total, completed, active, cancelled, completionRate, categoryStats } });
  } catch (err) { next(err); }
};

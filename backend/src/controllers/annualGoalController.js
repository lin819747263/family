const { AnnualGoal, GoalMilestone, User } = require('../models');
const { Op } = require('sequelize');

// 重算目标进度（里程碑完成比例）
async function recalcProgress(goalId) {
  const milestones = await GoalMilestone.findAll({ where: { annualGoalId: goalId } });
  if (milestones.length === 0) return;
  const done = milestones.filter(m => m.done).length;
  const progress = Math.round(done / milestones.length * 100);
  await AnnualGoal.update({ progress }, { where: { id: goalId } });
}

// ===== 年度目标 =====

exports.create = async (req, res, next) => {
  try {
    const { year, title, description, category, startDate, endDate, familyId } = req.body;
    if (!title) return res.status(400).json({ code: 400, message: '请输入目标标题' });
    if (!year) return res.status(400).json({ code: 400, message: '请选择年份' });
    const goal = await AnnualGoal.create({
      year, title, description, category, startDate, endDate,
      familyId,
      createdBy: req.userId,
      status: 'active',
      progress: 0
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
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
        { model: GoalMilestone, as: 'milestones' }
      ],
      order: [['status', 'ASC'], ['category', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ code: 0, data: goals });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const goal = await AnnualGoal.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
        { model: GoalMilestone, as: 'milestones' }
      ]
    });
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    res.json({ code: 0, data: goal });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const goal = await AnnualGoal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    const allowed = (({ title, description, category, startDate, endDate, status }) => ({ title, description, category, startDate, endDate, status }))(req.body);
    // 如果标记为完成，自动设置完成日期和进度100%
    if (allowed.status === 'completed' && goal.status !== 'completed') {
      allowed.completedAt = new Date().toISOString().slice(0, 10);
      allowed.progress = 100;
    }
    // 如果恢复进行，清空完成日期，重算进度
    if (allowed.status === 'active' && goal.status !== 'active') {
      allowed.completedAt = null;
      await goal.update(allowed);
      await recalcProgress(goal.id);
      const updated = await AnnualGoal.findByPk(goal.id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
          { model: GoalMilestone, as: 'milestones' }
        ]
      });
      return res.json({ code: 0, data: updated, message: '更新成功' });
    }
    await goal.update(allowed);
    const updated = await AnnualGoal.findByPk(goal.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
        { model: GoalMilestone, as: 'milestones' }
      ]
    });
    res.json({ code: 0, data: updated, message: '更新成功' });
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
    const avgProgress = total > 0 ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / total) : 0;
    res.json({ code: 0, data: { total, completed, active, avgProgress } });
  } catch (err) { next(err); }
};

// ===== 里程碑 =====

exports.addMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, targetDate } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入里程碑名称' });
    const goal = await AnnualGoal.findByPk(id);
    if (!goal) return res.status(404).json({ code: 404, message: '目标不存在' });
    const ms = await GoalMilestone.create({ annualGoalId: id, name, targetDate });
    await recalcProgress(id);
    res.status(201).json({ code: 0, data: ms, message: '里程碑添加成功' });
  } catch (err) { next(err); }
};

exports.updateMilestone = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    const { name, targetDate } = req.body;
    const ms = await GoalMilestone.findOne({ where: { id, annualGoalId: goalId } });
    if (!ms) return res.status(404).json({ code: 404, message: '里程碑不存在' });
    await ms.update({ name, targetDate });
    res.json({ code: 0, data: ms, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.toggleMilestone = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    const ms = await GoalMilestone.findOne({ where: { id, annualGoalId: goalId } });
    if (!ms) return res.status(404).json({ code: 404, message: '里程碑不存在' });
    await ms.update({ done: !ms.done });
    await recalcProgress(goalId);
    res.json({ code: 0, data: ms, message: ms.done ? '已完成' : '已取消完成' });
  } catch (err) { next(err); }
};

exports.deleteMilestone = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    const ms = await GoalMilestone.findOne({ where: { id, annualGoalId: goalId } });
    if (!ms) return res.status(404).json({ code: 404, message: '里程碑不存在' });
    await ms.destroy();
    await recalcProgress(goalId);
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

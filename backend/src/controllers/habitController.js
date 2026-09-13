const { Habit, HabitRecord, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ===== 习惯 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const { name, icon, color, freq, weekdays, remindTime, goalDays, familyId } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入习惯名称' });
    const habit = await Habit.create({
      familyId, name, icon, color, freq, weekdays, remindTime, goalDays,
      createdBy: req.userId, status: 'active'
    });
    res.status(201).json({ code: 0, data: habit, message: '习惯创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const where = { familyId, status: 'active' };
    const habits = await Habit.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] },
        { model: HabitRecord, as: 'records', attributes: ['date', 'userId'] }
      ],
      order: [['created_at', 'ASC']]
    });
    res.json({ code: 0, data: habits });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const habit = await Habit.findByPk(req.params.id);
    if (!habit) return res.status(404).json({ code: 404, message: '习惯不存在' });
    const allowed = (({ name, icon, color, freq, weekdays, remindTime, goalDays }) => ({ name, icon, color, freq, weekdays, remindTime, goalDays }))(req.body);
    await habit.update(allowed);
    res.json({ code: 0, data: habit, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const habit = await Habit.findByPk(req.params.id);
    if (!habit) return res.status(404).json({ code: 404, message: '习惯不存在' });
    await habit.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// ===== 打卡 =====

exports.check = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const targetDate = date || dayjs().format('YYYY-MM-DD');
    const habit = await Habit.findByPk(id);
    if (!habit || habit.status !== 'active') {
      return res.status(404).json({ code: 404, message: '习惯不存在' });
    }
    // 检查是否已打卡
    const existing = await HabitRecord.findOne({
      where: { habitId: id, userId: req.userId, date: targetDate }
    });
    if (existing) {
      // 取消打卡
      await existing.destroy();
      return res.json({ code: 0, data: { checked: false }, message: '已取消打卡' });
    }
    // 打卡
    const record = await HabitRecord.create({ habitId: id, userId: req.userId, date: targetDate });
    res.json({ code: 0, data: { checked: true, record }, message: '打卡成功' });
  } catch (err) { next(err); }
};

// ===== 统计 =====

exports.getStats = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const today = dayjs().format('YYYY-MM-DD');
    const habits = await Habit.findAll({ where: { familyId, status: 'active' } });
    const habitIds = habits.map(h => h.id);
    if (habitIds.length === 0) {
      return res.json({ code: 0, data: { total: 0, doneToday: 0, totalChecks: 0, avgRate: 0 } });
    }
    // 今日打卡数
    const doneToday = await HabitRecord.count({
      where: { habitId: { [Op.in]: habitIds }, date: today }
    });
    // 累计打卡数
    const totalChecks = await HabitRecord.count({
      where: { habitId: { [Op.in]: habitIds } }
    });
    // 近30天完成率
    const thirtyDaysAgo = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    const recentChecks = await HabitRecord.count({
      where: { habitId: { [Op.in]: habitIds }, date: { [Op.gte]: thirtyDaysAgo } }
    });
    const avgRate = habits.length > 0 ? Math.round(recentChecks / (habits.length * 30) * 100) : 0;
    res.json({ code: 0, data: { total: habits.length, doneToday, totalChecks, avgRate: Math.min(avgRate, 100) } });
  } catch (err) { next(err); }
};

// ===== 热力图数据 =====

exports.getRecords = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days } = req.query;
    const numDays = parseInt(days) || 180;
    const startDate = dayjs().subtract(numDays - 1, 'day').format('YYYY-MM-DD');
    const records = await HabitRecord.findAll({
      where: { habitId: id, date: { [Op.gte]: startDate } },
      attributes: ['date', 'userId'],
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }]
    });
    res.json({ code: 0, data: records });
  } catch (err) { next(err); }
};

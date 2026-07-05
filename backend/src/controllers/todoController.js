const { Todo, User, FamilyMember, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ===== 待办 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, dueTime, reminderBefore, familyId } = req.body;
    if (!title) return res.status(400).json({ code: 400, message: '请输入待办标题' });

    const item = await Todo.create({
      title, description,
      priority: priority || 'medium',
      dueDate, dueTime,
      reminderBefore: reminderBefore ?? 0,
      familyId: familyId || req.body.familyId,
      createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, filter, priority, search, page = 1, pageSize = 50 } = req.query;
    const where = { familyId, status: 'active' };

    // 默认只显示未归档的
    if (filter === 'archived') {
      where.archived = true;
    } else {
      where.archived = false;
    }

    // 筛选: pending(待完成), done(已完成), overdue(已过期)
    if (filter === 'pending') {
      where.completed = false;
    } else if (filter === 'done') {
      where.completed = true;
    } else if (filter === 'overdue') {
      where.completed = false;
      where.dueDate = { [Op.lt]: dayjs().format('YYYY-MM-DD') };
    }
    if (priority) where.priority = priority;

    // 搜索标题和描述
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Todo.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [
        ['completed', 'ASC'],
        [sequelize.literal('CASE WHEN `due_date` IS NULL THEN 1 ELSE 0 END'), 'ASC'],
        ['due_date', 'ASC'],
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    const today = dayjs().format('YYYY-MM-DD');
    const list = rows.map(r => {
      const json = r.toJSON();
      json.overdue = !json.completed && json.dueDate && json.dueDate < today;
      return json;
    });

    res.json({ code: 0, data: { list, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    res.json({ code: 0, data: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    if (item.createdBy !== req.userId) {
      const membership = await FamilyMember.findOne({ where: { familyId: item.familyId, userId: req.userId } });
      if (!membership) return res.status(403).json({ code: 403, message: '无权操作' });
    }
    const allowed = (({ title, description, priority, dueDate, dueTime, reminderBefore }) =>
      ({ title, description, priority, dueDate, dueTime, reminderBefore }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, data: item, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    if (item.createdBy !== req.userId) {
      const membership = await FamilyMember.findOne({ where: { familyId: item.familyId, userId: req.userId } });
      if (!membership) return res.status(403).json({ code: 403, message: '无权操作' });
    }
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// 切换完成状态（完成时自动归档）
exports.toggleComplete = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    // 完成时自动归档
    if (item.completed) {
      item.archived = true;
      item.archivedAt = new Date();
    }
    await item.save();
    res.json({ code: 0, data: item, message: item.completed ? '已完成并归档' : '已恢复' });
  } catch (err) { next(err); }
};

// 归档
exports.archive = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    item.archived = true;
    item.archivedAt = new Date();
    if (!item.completed) {
      item.completed = true;
      item.completedAt = new Date();
    }
    await item.save();
    res.json({ code: 0, data: item, message: '已归档' });
  } catch (err) { next(err); }
};

// 取消归档（恢复到待办列表）
exports.unarchive = async (req, res, next) => {
  try {
    const item = await Todo.findByPk(req.params.id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '待办不存在' });
    item.archived = false;
    item.archivedAt = null;
    item.completed = false;
    item.completedAt = null;
    await item.save();
    res.json({ code: 0, data: item, message: '已恢复' });
  } catch (err) { next(err); }
};

// 批量归档所有已完成的待办
exports.archiveCompleted = async (req, res, next) => {
  try {
    const { familyId } = req.body;
    const [count] = await Todo.update(
      { archived: true, archivedAt: new Date() },
      { where: { familyId, status: 'active', completed: true, archived: false } }
    );
    res.json({ code: 0, data: { count }, message: `已归档 ${count} 条` });
  } catch (err) { next(err); }
};

// 获取即将到期的待办（用于提醒）
exports.getUpcoming = async (req, res, next) => {
  try {
    const { familyId, days = 7 } = req.query;
    const today = dayjs().format('YYYY-MM-DD');
    const limit = dayjs().add(parseInt(days), 'day').format('YYYY-MM-DD');

    const items = await Todo.findAll({
      where: {
        familyId,
        status: 'active',
        archived: false,
        completed: false,
        dueDate: { [Op.between]: [today, limit] }
      },
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['due_date', 'ASC']]
    });

    const list = items.map(r => {
      const json = r.toJSON();
      json.daysLeft = dayjs(json.dueDate).diff(dayjs(), 'day');
      return json;
    });

    res.json({ code: 0, data: list });
  } catch (err) { next(err); }
};

// 获取统计
exports.getStats = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const today = dayjs().format('YYYY-MM-DD');

    const [total, completed, archived, overdue, dueToday] = await Promise.all([
      Todo.count({ where: { familyId, status: 'active', archived: false } }),
      Todo.count({ where: { familyId, status: 'active', archived: false, completed: true } }),
      Todo.count({ where: { familyId, status: 'active', archived: true } }),
      Todo.count({ where: { familyId, status: 'active', archived: false, completed: false, dueDate: { [Op.lt]: today } } }),
      Todo.count({ where: { familyId, status: 'active', archived: false, completed: false, dueDate: today } })
    ]);

    res.json({ code: 0, data: { total, completed, pending: total - completed, archived, overdue, dueToday } });
  } catch (err) { next(err); }
};

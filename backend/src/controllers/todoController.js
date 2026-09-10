const { Todo, User, FamilyMember, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ===== 待办 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const {
      title, description, priority, dueDate, dueTime, reminderBefore, familyId,
      repeatType, repeatInterval, repeatUnit, repeatWeekdays,
      repeatDayOfMonth, repeatEndType, repeatCount, repeatEndDate
    } = req.body;
    if (!title) return res.status(400).json({ code: 400, message: '请输入待办标题' });

    const item = await Todo.create({
      title, description,
      priority: priority || 'medium',
      dueDate, dueTime,
      reminderBefore: reminderBefore ?? 0,
      repeatType: repeatType || 'none',
      repeatInterval: repeatInterval || 1,
      repeatUnit: repeatUnit || 'days',
      repeatWeekdays: repeatWeekdays || null,
      repeatDayOfMonth: repeatDayOfMonth || 1,
      repeatEndType: repeatEndType || 'never',
      repeatCount: repeatCount || 10,
      repeatEndDate: repeatEndDate || null,
      repeatCurrentCount: 0,
      familyId: familyId || req.body.familyId,
      createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, filter, priority, search, dueDate, dueDateFrom, dueDateTo, page = 1, pageSize = 50 } = req.query;
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

    // 时间筛选
    if (dueDate) {
      where.dueDate = dueDate;
    } else if (dueDateFrom && dueDateTo) {
      where.dueDate = { [Op.between]: [dueDateFrom, dueDateTo] };
    } else if (dueDateFrom) {
      where.dueDate = { [Op.gte]: dueDateFrom };
    } else if (dueDateTo) {
      where.dueDate = { [Op.lte]: dueDateTo };
    }

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
        [sequelize.literal('`Todo`.`due_date` IS NULL'), 'ASC'],
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
    const allowed = (({
      title, description, priority, dueDate, dueTime, reminderBefore,
      repeatType, repeatInterval, repeatUnit, repeatWeekdays,
      repeatDayOfMonth, repeatEndType, repeatCount, repeatEndDate
    }) => ({
      title, description, priority, dueDate, dueTime, reminderBefore,
      repeatType, repeatInterval, repeatUnit, repeatWeekdays,
      repeatDayOfMonth, repeatEndType, repeatCount, repeatEndDate
    }))(req.body);
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

      // 如果是重复待办，创建下一个
      if (item.repeatType && item.repeatType !== 'none') {
        await createNextRecurringTodo(item);
      }
    }
    await item.save();
    res.json({ code: 0, data: item, message: item.completed ? '已完成并归档' : '已恢复' });
  } catch (err) { next(err); }
};

// 计算下一个重复日期
function calculateNextDueDate(todo) {
  const { dueDate, repeatType, repeatInterval, repeatUnit, repeatWeekdays, repeatDayOfMonth } = todo;
  if (!dueDate) return null;

  let nextDate = dayjs(dueDate);

  switch (repeatType) {
    case 'daily':
      nextDate = nextDate.add(repeatInterval || 1, 'day');
      break;

    case 'weekly':
      nextDate = nextDate.add(1, 'week');
      break;

    case 'biweekly':
      nextDate = nextDate.add(2, 'week');
      break;

    case 'workdays':
      // 跳到下一个工作日
      do {
        nextDate = nextDate.add(1, 'day');
      } while (nextDate.day() === 0 || nextDate.day() === 6);
      break;

    case 'monthly':
      nextDate = nextDate.add(1, 'month');
      break;

    case 'yearly':
      nextDate = nextDate.add(1, 'year');
      break;

    case 'custom':
      const interval = repeatInterval || 1;
      switch (repeatUnit) {
        case 'days':
          nextDate = nextDate.add(interval, 'day');
          break;
        case 'weeks':
          if (repeatWeekdays && repeatWeekdays.length > 0) {
            // 找到下一个匹配的星期几
            let found = false;
            for (let i = 1; i <= 7; i++) {
              const candidate = nextDate.add(i, 'day');
              if (repeatWeekdays.includes(candidate.day())) {
                nextDate = candidate;
                found = true;
                break;
              }
            }
            if (!found) nextDate = nextDate.add(interval, 'week');
          } else {
            nextDate = nextDate.add(interval, 'week');
          }
          break;
        case 'months':
          nextDate = nextDate.add(interval, 'month');
          if (repeatDayOfMonth) {
            if (repeatDayOfMonth === -1) {
              nextDate = nextDate.endOf('month');
            } else {
              nextDate = nextDate.date(Math.min(repeatDayOfMonth, nextDate.daysInMonth()));
            }
          }
          break;
        case 'years':
          nextDate = nextDate.add(interval, 'year');
          break;
      }
      break;

    default:
      return null;
  }

  return nextDate.format('YYYY-MM-DD');
}

// 创建下一个重复待办
async function createNextRecurringTodo(originalTodo) {
  try {
    // 检查是否达到重复次数限制
    if (originalTodo.repeatEndType === 'count') {
      const newCount = (originalTodo.repeatCurrentCount || 0) + 1;
      if (newCount >= (originalTodo.repeatCount || 10)) {
        return; // 达到次数限制，不再创建
      }
    }

    // 检查是否超过结束日期
    if (originalTodo.repeatEndType === 'date' && originalTodo.repeatEndDate) {
      if (dayjs().isAfter(dayjs(originalTodo.repeatEndDate))) {
        return; // 超过结束日期
      }
    }

    const nextDueDate = calculateNextDueDate(originalTodo);
    if (!nextDueDate) return;

    // 检查是否超过结束日期
    if (originalTodo.repeatEndType === 'date' && originalTodo.repeatEndDate) {
      if (dayjs(nextDueDate).isAfter(dayjs(originalTodo.repeatEndDate))) {
        return;
      }
    }

    await Todo.create({
      title: originalTodo.title,
      description: originalTodo.description,
      priority: originalTodo.priority,
      dueDate: nextDueDate,
      dueTime: originalTodo.dueTime,
      reminderBefore: originalTodo.reminderBefore,
      repeatType: originalTodo.repeatType,
      repeatInterval: originalTodo.repeatInterval,
      repeatUnit: originalTodo.repeatUnit,
      repeatWeekdays: originalTodo.repeatWeekdays,
      repeatDayOfMonth: originalTodo.repeatDayOfMonth,
      repeatEndType: originalTodo.repeatEndType,
      repeatCount: originalTodo.repeatCount,
      repeatEndDate: originalTodo.repeatEndDate,
      repeatCurrentCount: (originalTodo.repeatCurrentCount || 0) + 1,
      parentTodoId: originalTodo.parentTodoId || originalTodo.id,
      familyId: originalTodo.familyId,
      createdBy: originalTodo.createdBy
    });
  } catch (err) {
    console.error('创建重复待办失败:', err);
  }
}

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

    // 单条 SQL 完成所有统计，替代 5 次 COUNT 查询
    const [results] = await sequelize.query(`
      SELECT
        SUM(CASE WHEN archived = 0 THEN 1 ELSE 0 END) AS total,
        SUM(CASE WHEN archived = 0 AND completed = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) AS archived,
        SUM(CASE WHEN archived = 0 AND completed = 0 AND due_date < '${today}' THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN archived = 0 AND completed = 0 AND due_date = '${today}' THEN 1 ELSE 0 END) AS dueToday
      FROM todos
      WHERE family_id = ${parseInt(familyId)} AND status = 'active'
    `);

    const row = results[0] || {};
    const total = parseInt(row.total) || 0;
    const completed = parseInt(row.completed) || 0;

    res.json({ code: 0, data: {
      total,
      completed,
      pending: total - completed,
      archived: parseInt(row.archived) || 0,
      overdue: parseInt(row.overdue) || 0,
      dueToday: parseInt(row.dueToday) || 0
    }});
  } catch (err) { next(err); }
};

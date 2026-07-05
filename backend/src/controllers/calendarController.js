const { Anniversary, Todo } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { computeNextDate, getLunarDisplay } = require('../utils/lunar');

/**
 * 获取指定月份的日历事件（纪念日 + 待办）
 * GET /api/calendar/events?familyId=1&year=2026&month=7
 */
exports.getMonthEvents = async (req, res, next) => {
  try {
    const { familyId, year, month } = req.query;
    if (!familyId || !year || !month) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    const y = parseInt(year);
    const m = parseInt(month);
    const startDate = dayjs(`${y}-${String(m).padStart(2, '0')}-01`);
    const endDate = startDate.endOf('month');
    const today = dayjs().startOf('day');

    // 1. 获取纪念日
    const anniversaries = await Anniversary.findAll({
      where: { familyId, status: 'active' }
    });

    const events = [];

    for (const ann of anniversaries) {
      const json = ann.toJSON();
      // 计算本月内的纪念日
      for (let d = startDate; d.isBefore(endDate) || d.isSame(endDate, 'day'); d = d.add(1, 'day')) {
        const { nextDate } = computeNextDate(json, d.startOf('day'));
        if (nextDate && dayjs(nextDate).isSame(d, 'day')) {
          let lunarDisplay = null;
          if (json.calendarType === 'lunar' && json.lunarDate) {
            lunarDisplay = getLunarDisplay(json.lunarDate);
          }
          events.push({
            type: 'anniversary',
            id: json.id,
            title: json.title,
            date: d.format('YYYY-MM-DD'),
            color: json.color || '#667eea',
            icon: json.type === 'birthday' ? 'User' : json.type === 'anniversary' ? 'Star' : json.type === 'holiday' ? 'Flag' : 'Calendar',
            annType: json.type,
            lunarDisplay,
            isToday: d.isSame(today, 'day')
          });
          break; // 每个纪念日每月只出现一次
        }
      }
    }

    // 2. 获取待办
    const todos = await Todo.findAll({
      where: {
        familyId,
        status: 'active',
        dueDate: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      }
    });

    for (const todo of todos) {
      const json = todo.toJSON();
      events.push({
        type: 'todo',
        id: json.id,
        title: json.title,
        date: json.dueDate,
        dueTime: json.dueTime,
        priority: json.priority,
        completed: json.completed,
        color: json.completed ? '#10b981' : json.priority === 'high' ? '#ef4444' : json.priority === 'medium' ? '#f59e0b' : '#667eea',
        icon: 'Finished',
        isToday: dayjs(json.dueDate).isSame(today, 'day'),
        isOverdue: !json.completed && json.dueDate < today.format('YYYY-MM-DD')
      });
    }

    // 按日期排序
    events.sort((a, b) => a.date.localeCompare(b.date));

    res.json({ code: 0, data: events });
  } catch (err) { next(err); }
};

/**
 * 获取指定日期的事件详情
 * GET /api/calendar/day?familyId=1&date=2026-07-01
 */
exports.getDayEvents = async (req, res, next) => {
  try {
    const { familyId, date } = req.query;
    if (!familyId || !date) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    const targetDate = dayjs(date);
    const today = dayjs().startOf('day');

    // 1. 纪念日
    const anniversaries = await Anniversary.findAll({
      where: { familyId, status: 'active' }
    });

    const events = [];

    for (const ann of anniversaries) {
      const json = ann.toJSON();
      const { nextDate, daysLeft } = computeNextDate(json, today);
      if (nextDate && dayjs(nextDate).isSame(targetDate, 'day')) {
        let lunarDisplay = null;
        if (json.calendarType === 'lunar' && json.lunarDate) {
          lunarDisplay = getLunarDisplay(json.lunarDate);
        }
        events.push({
          type: 'anniversary',
          id: json.id,
          title: json.title,
          date: nextDate,
          color: json.color || '#667eea',
          annType: json.type,
          lunarDisplay,
          daysLeft,
          isToday: daysLeft === 0
        });
      }
    }

    // 2. 待办
    const todos = await Todo.findAll({
      where: {
        familyId,
        status: 'active',
        dueDate: date
      }
    });

    for (const todo of todos) {
      const json = todo.toJSON();
      events.push({
        type: 'todo',
        id: json.id,
        title: json.title,
        date: json.dueDate,
        dueTime: json.dueTime,
        priority: json.priority,
        completed: json.completed,
        color: json.completed ? '#10b981' : json.priority === 'high' ? '#ef4444' : '#f59e0b',
        isOverdue: !json.completed && json.dueDate < today.format('YYYY-MM-DD')
      });
    }

    res.json({ code: 0, data: events });
  } catch (err) { next(err); }
};

const { Anniversary, User, FamilyMember, Notification } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Solar, Lunar } = require('lunar-javascript');
const { lunarToSolar, computeNextDate, getLunarDisplay } = require('../utils/lunar');

// ===== 纪念日 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const { title, date, type, color, calendarType, lunarDate, repeatYearly, reminderDays, note } = req.body;
    if (!title) return res.status(400).json({ code: 400, message: '请输入名称' });
    if (!date) return res.status(400).json({ code: 400, message: '请选择日期' });

    const data = {
      title, type: type || 'other',
      color: color || '#667eea',
      calendarType: calendarType || 'solar',
      repeatYearly: repeatYearly !== false, reminderDays: reminderDays ?? 3,
      note, familyId: req.body.familyId, createdBy: req.userId
    };

    if (calendarType === 'lunar' && lunarDate) {
      // 农历：date 存储对应的公历日期，lunarDate 存储农历原始数据
      data.lunarDate = typeof lunarDate === 'string' ? lunarDate : JSON.stringify(lunarDate);
      data.date = date; // 前端已转换好的公历日期
    } else {
      data.date = date;
    }

    const item = await Anniversary.create(data);
    res.status(201).json({ code: 0, data: item, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, type, search } = req.query;
    const where = { familyId, status: 'active' };
    if (type) where.type = type;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { note: { [Op.like]: `%${search}%` } }
      ];
    }

    const items = await Anniversary.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['date', 'ASC']]
    });

    const today = dayjs().startOf('day');
    const enriched = items.map(item => {
      const json = item.toJSON();
      const { nextDate, daysLeft, age } = computeNextDate(json, today);

      // 为农历纪念日添加农历显示信息
      const lunarDisplay = json.calendarType === 'lunar' ? getLunarDisplay(json.lunarDate) : null;

      return { ...json, nextDate, daysLeft, age, lunarDisplay };
    });

    enriched.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ code: 0, data: enriched });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Anniversary.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '纪念日不存在' });
    res.json({ code: 0, data: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Anniversary.findByPk(id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '纪念日不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能修改自己创建的纪念日' });

    const allowed = (({ title, date, type, color, calendarType, lunarDate, repeatYearly, reminderDays, note }) =>
      ({ title, date, type, color, calendarType, lunarDate, repeatYearly, reminderDays, note }))(req.body);

    if (allowed.lunarDate && typeof allowed.lunarDate !== 'string') {
      allowed.lunarDate = JSON.stringify(allowed.lunarDate);
    }

    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Anniversary.findByPk(id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '纪念日不存在' });
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能删除自己创建的纪念日' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// 获取即将到来的纪念日（用于仪表盘/提醒）
exports.getUpcoming = async (req, res, next) => {
  try {
    const { familyId, days = 30 } = req.query;
    const items = await Anniversary.findAll({
      where: { familyId, status: 'active' },
      order: [['date', 'ASC']]
    });

    const today = dayjs().startOf('day');
    const limit = today.add(parseInt(days), 'day');
    const upcoming = [];

    for (const item of items) {
      const json = item.toJSON();
      const { nextDate, daysLeft, age } = computeNextDate(json, today);

      if (daysLeft >= 0 && dayjs(nextDate).isBefore(limit)) {
        // 农历显示
        const lunarDisplay = json.calendarType === 'lunar' ? getLunarDisplay(json.lunarDate) : null;
        upcoming.push({ ...json, nextDate, daysLeft, age, lunarDisplay });
      }
    }

    upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ code: 0, data: upcoming });
  } catch (err) { next(err); }
};

// 手动触发提醒
exports.triggerReminders = async (req, res, next) => {
  try {
    const { familyId } = req.body;
    const today = dayjs().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');

    const anniversaries = await Anniversary.findAll({
      where: { familyId, status: 'active' }
    });

    let reminded = 0;
    const results = [];

    for (const ann of anniversaries) {
      const json = ann.toJSON();
      const { nextDate, daysLeft } = computeNextDate(json, today);
      const reminderDays = ann.reminderDays || 3;

      if (daysLeft >= 0 && daysLeft <= reminderDays) {
        const existing = await Notification.findOne({
          where: { relatedId: ann.id, relatedType: 'anniversary', createdAt: { [Op.startsWith]: todayStr } }
        });
        if (existing) {
          results.push({ title: ann.title, skipped: true });
          continue;
        }

        const members = await FamilyMember.findAll({ where: { familyId }, attributes: ['userId'] });
        for (const m of members) {
          const daysText = daysLeft === 0 ? '就是今天' : `还有${daysLeft}天`;
          await Notification.create({
            userId: m.userId,
            type: 'anniversary',
            title: daysLeft === 0 ? `🎉 ${ann.title}` : `📅 ${ann.title}即将到来`,
            content: `${ann.title}${daysText}到来`,
            relatedId: ann.id,
            relatedType: 'anniversary'
          });
        }
        reminded++;
        results.push({ title: ann.title, daysLeft });
      }
    }

    res.json({ code: 0, data: { reminded, results }, message: reminded > 0 ? `已发送 ${reminded} 条提醒` : '暂无需提醒的纪念日' });
  } catch (err) { next(err); }
};

// ===== 农历转换 API =====

/**
 * 公历转农历（供前端显示）
 * GET /anniversary/lunar-info?date=2024-01-01
 */
exports.getLunarInfo = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ code: 400, message: '请提供日期参数' });

    const [year, month, day] = date.split('-').map(Number);
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    const monthNames = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const dayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

    const lunarMonth = lunar.getMonth();
    const isLeapMonth = lunar.getMonth() < 0;

    res.json({
      code: 0,
      data: {
        lunarYear: lunar.getYear(),
        lunarMonth: Math.abs(lunarMonth),
        lunarDay: lunar.getDay(),
        isLeapMonth,
        display: `${isLeapMonth ? '闰' : ''}${monthNames[Math.abs(lunarMonth)]}月${dayNames[lunar.getDay()]}`,
        yearGanZhi: lunar.getYearInGanZhi(),
        yearShengXiao: lunar.getYearShengXiao(),
        lunarDate: JSON.stringify({ month: Math.abs(lunarMonth), day: lunar.getDay(), isLeapMonth })
      }
    });
  } catch (err) { next(err); }
};

/**
 * 农历转公历（供前端日期选择器）
 * GET /anniversary/solar-date?lunarYear=2024&lunarMonth=1&lunarDay=1&isLeapMonth=false
 */
exports.getSolarDate = async (req, res, next) => {
  try {
    const { lunarYear, lunarMonth, lunarDay, isLeapMonth } = req.query;
    if (!lunarYear || !lunarMonth || !lunarDay) {
      return res.status(400).json({ code: 400, message: '请提供完整的农历日期参数' });
    }

    const month = parseInt(lunarMonth);
    const day = parseInt(lunarDay);
    const leap = isLeapMonth === 'true' || isLeapMonth === '1';

    try {
      const solar = lunarToSolar(parseInt(lunarYear), month, day, leap);
      res.json({
        code: 0,
        data: {
          date: `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`,
          lunarDate: JSON.stringify({ month, day, isLeapMonth: leap })
        }
      });
    } catch {
      res.status(400).json({ code: 400, message: '无效的农历日期，该年可能没有此闰月' });
    }
  } catch (err) { next(err); }
};

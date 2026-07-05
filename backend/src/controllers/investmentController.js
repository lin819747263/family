const { Investment, FamilyMember } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// ===== 平台管理 =====

// 获取所有平台（去重）
exports.getPlatforms = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const records = await Investment.findAll({
      where: { familyId },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('platform')), 'platform']],
      raw: true
    });
    const platforms = records.map(r => r.platform).filter(Boolean).sort();
    res.json({ code: 0, data: platforms });
  } catch (err) { next(err); }
};

// ===== 记录 CRUD =====

// 创建/更新月度记录（upsert）
exports.upsert = async (req, res, next) => {
  try {
    const { familyId, platform, year, month, profit, balance, note } = req.body;
    if (!familyId || !platform || !year || !month) {
      return res.status(400).json({ code: 400, message: '缺少必填字段' });
    }
    if (month < 1 || month > 12) {
      return res.status(400).json({ code: 400, message: '月份无效' });
    }

    const [record, created] = await Investment.findOrCreate({
      where: { familyId, platform, year, month },
      defaults: {
        profit: profit || 0,
        balance: balance || 0,
        note: note || '',
        createdBy: req.userId
      }
    });

    if (!created) {
      await record.update({
        profit: profit ?? record.profit,
        balance: balance ?? record.balance,
        note: note ?? record.note
      });
    }

    res.json({ code: 0, data: record, message: created ? '创建成功' : '更新成功' });
  } catch (err) { next(err); }
};

// 获取列表
exports.getList = async (req, res, next) => {
  try {
    const { familyId, year, platform } = req.query;
    const where = { familyId };
    if (year) where.year = parseInt(year);
    if (platform) where.platform = platform;

    const records = await Investment.findAll({
      where,
      include: [{ model: require('../models').User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['year', 'DESC'], ['month', 'DESC'], ['platform', 'ASC']]
    });

    res.json({ code: 0, data: records });
  } catch (err) { next(err); }
};

// 删除记录
exports.remove = async (req, res, next) => {
  try {
    const record = await Investment.findByPk(req.params.id);
    if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });
    // 权限检查：同家庭成员可删除
    const member = await FamilyMember.findOne({ where: { familyId: record.familyId, userId: req.userId } });
    if (!member) return res.status(403).json({ code: 403, message: '无权操作' });
    await record.destroy();
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// ===== 统计报表 =====

// 获取年度统计
exports.getYearlyStats = async (req, res, next) => {
  try {
    const { familyId, year } = req.query;
    if (!familyId || !year) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    const records = await Investment.findAll({
      where: { familyId, year: parseInt(year) },
      raw: true
    });

    // 按平台分组
    const platformMap = {};
    // 按月分组
    const monthMap = {};

    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { month: m, totalProfit: 0, platforms: {} };
    }

    for (const r of records) {
      // 平台统计
      if (!platformMap[r.platform]) {
        platformMap[r.platform] = {
          platform: r.platform,
          totalProfit: 0,
          totalBalance: 0,
          monthlyData: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, profit: 0, balance: 0 }))
        };
      }
      const p = platformMap[r.platform];
      p.totalProfit += parseFloat(r.profit || 0);
      p.totalBalance = parseFloat(r.balance || 0); // 取最新余额
      p.monthlyData[r.month - 1] = { profit: parseFloat(r.profit || 0), balance: parseFloat(r.balance || 0) };

      // 月度统计
      monthMap[r.month].totalProfit += parseFloat(r.profit || 0);
      monthMap[r.month].platforms[r.platform] = parseFloat(r.profit || 0);
    }

    const platforms = Object.values(platformMap).sort((a, b) => b.totalProfit - a.totalProfit);
    const months = Object.values(monthMap);
    const yearTotalProfit = platforms.reduce((s, p) => s + p.totalProfit, 0);
    const yearTotalBalance = platforms.reduce((s, p) => s + p.totalBalance, 0);

    res.json({
      code: 0,
      data: {
        yearTotalProfit,
        yearTotalBalance,
        platformCount: platforms.length,
        platforms,
        months
      }
    });
  } catch (err) { next(err); }
};

// 获取多年对比
exports.getMultiYearStats = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const records = await Investment.findAll({
      where: { familyId },
      attributes: [
        'year',
        [sequelize.fn('SUM', sequelize.col('profit')), 'totalProfit']
      ],
      group: ['year'],
      order: [['year', 'ASC']],
      raw: true
    });

    res.json({
      code: 0,
      data: records.map(r => ({
        year: r.year,
        totalProfit: parseFloat(r.totalProfit || 0)
      }))
    });
  } catch (err) { next(err); }
};

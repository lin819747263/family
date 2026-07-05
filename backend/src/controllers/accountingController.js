const { Transaction, AccountBook, Category, Budget, RecurringBill, Notification, FamilyMember, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { calcNextRunDate } = require('../utils/recurring');

// 验证用户是否有权访问该账本
async function verifyBookAccess(bookId, userId) {
  const book = await AccountBook.findByPk(bookId);
  if (!book) return false;
  // 个人账本：必须是创建者
  if (book.type === 'personal') return book.userId === userId;
  // 家庭账本：必须是家庭成员
  if (book.familyId) {
    const member = await FamilyMember.findOne({ where: { familyId: book.familyId, userId } });
    return !!member;
  }
  return false;
}

// ===== 账本管理 =====
exports.createBook = async (req, res, next) => {
  try {
    const { name, type, description, icon, familyId } = req.body;
    const book = await AccountBook.create({ name, type: type || 'family', description, icon, familyId, userId: req.userId });
    res.status(201).json({ code: 0, data: book, message: '账本创建成功' });
  } catch (err) { next(err); }
};

exports.getBooks = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    if (!familyId) return res.json({ code: 0, data: [] });
    const books = await AccountBook.findAll({
      where: { [Op.or]: [{ familyId }, { userId: req.userId, type: 'personal' }], status: 'active' }
    });
    res.json({ code: 0, data: books });
  } catch (err) { next(err); }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const book = await AccountBook.findOne({ where: { id, userId: req.userId } });
    if (!book) return res.status(404).json({ code: 404, message: '账本不存在' });

    // 检查是否有关联的交易记录
    const txnCount = await Transaction.count({ where: { bookId: id, status: 'normal' } });
    if (txnCount > 0 && force !== 'true') {
      return res.status(400).json({ code: 400, message: `该账本下还有 ${txnCount} 笔交易记录`, data: { txnCount } });
    }

    // 强制删除：先清除关联数据
    if (force === 'true') {
      await Transaction.destroy({ where: { bookId: id } });
      await Budget.destroy({ where: { bookId: id } });
      await RecurringBill.destroy({ where: { bookId: id } });
    }

    await book.destroy();
    res.json({ code: 0, message: '账本已删除' });
  } catch (err) { next(err); }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = (({ name, description, icon }) => ({ name, description, icon }))(req.body);
    await AccountBook.update(allowed, { where: { id, userId: req.userId } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

// ===== 记账 =====
exports.createTransaction = async (req, res, next) => {
  try {
    const allowed = (({ type, amount, categoryId, note, transactionDate, tags, bookId }) => ({ type, amount, categoryId, note, transactionDate, tags, bookId }))(req.body);
    // 验证账本访问权限
    if (!await verifyBookAccess(allowed.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const txn = await Transaction.create({
      ...allowed,
      transactionDate: allowed.transactionDate || dayjs().format('YYYY-MM-DD'),
      createdBy: req.userId,
      source: 'manual'
    });
    // 检查预算预警
    await checkBudgetWarning(allowed.bookId, allowed.type, allowed.categoryId, req.userId);
    res.status(201).json({ code: 0, data: txn, message: '记账成功' });
  } catch (err) { next(err); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { bookId, startDate, endDate, categoryId, type, search, page = 1, pageSize = 20 } = req.query;
    if (!bookId) return res.json({ code: 0, data: { list: [], total: 0, page: 1, pageSize: 20 } });
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const where = { bookId, status: 'normal' };
    if (startDate) where.transactionDate = { [Op.gte]: startDate };
    if (endDate) where.transactionDate = { ...where.transactionDate, [Op.lte]: endDate };
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (search) where.note = { [Op.like]: `%${search}%` };
    const { count, rows } = await Transaction.findAndCountAll({
      where, include: [{ model: Category, attributes: ['id', 'name', 'icon', 'type'] }],
      order: [['transaction_date', 'DESC'], ['created_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = (({ type, amount, categoryId, note, transactionDate, tags }) => ({ type, amount, categoryId, note, transactionDate, tags }))(req.body);
    await Transaction.update(allowed, { where: { id, createdBy: req.userId } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Transaction.update({ status: 'deleted' }, { where: { id, createdBy: req.userId } });
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { next(err); }
};

// ===== 分类管理 =====
exports.getCategories = async (req, res, next) => {
  try {
    const { type, familyId, tree } = req.query;
    const where = { [Op.or]: [{ builtIn: true }] };
    if (familyId) where[Op.or].push({ familyId });
    if (type) where.type = type;
    const categories = await Category.findAll({ where, order: [['sort', 'ASC']] });

    // 返回树形结构
    if (tree === 'true') {
      const map = {};
      const roots = [];
      categories.forEach(c => { map[c.id] = { ...c.toJSON(), children: [] }; });
      categories.forEach(c => {
        if (c.parentId && map[c.parentId]) {
          map[c.parentId].children.push(map[c.id]);
        } else if (!c.parentId) {
          roots.push(map[c.id]);
        }
      });
      return res.json({ code: 0, data: roots });
    }

    res.json({ code: 0, data: categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const allowed = (({ name, type, icon, parentId, sort, familyId }) => ({ name, type, icon, parentId, sort, familyId }))(req.body);
    if (!allowed.name) return res.status(400).json({ code: 400, message: '请输入分类名称' });
    if (!allowed.type) return res.status(400).json({ code: 400, message: '请选择收支类型' });
    const category = await Category.create({
      name: allowed.name, icon: allowed.icon || 'MoreFilled', type: allowed.type,
      parentId: allowed.parentId || null,
      familyId: allowed.familyId || null,
      sort: allowed.sort || 0,
      builtIn: false
    });
    res.status(201).json({ code: 0, data: category, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = (({ name, type, icon, sort }) => ({ name, type, icon, sort }))(req.body);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ code: 404, message: '分类不存在' });
    if (cat.builtIn) return res.status(400).json({ code: 400, message: '预设分类不可修改' });
    await cat.update(allowed);
    res.json({ code: 0, data: cat, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ code: 404, message: '分类不存在' });
    if (cat.builtIn) return res.status(400).json({ code: 400, message: '预设分类不可删除' });
    // 检查是否有子分类
    const childCount = await Category.count({ where: { parentId: id } });
    if (childCount > 0) return res.status(400).json({ code: 400, message: '请先删除子分类' });
    // 检查是否有关联的交易
    const txnCount = await Transaction.count({ where: { categoryId: id, status: 'normal' } });
    if (txnCount > 0) return res.status(400).json({ code: 400, message: `该分类下有 ${txnCount} 笔交易，无法删除`, data: { txnCount } });
    await cat.destroy();
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// ===== 预算管理 =====
exports.setBudget = async (req, res, next) => {
  try {
    const { bookId, categoryId, amount, warnPercent, month } = (({ bookId, categoryId, amount, warnPercent, month }) => ({ bookId, categoryId, amount, warnPercent, month }))(req.body);
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    // 查找该账本下该分类的预算（不区分月份）
    const where = { bookId };
    if (categoryId) where.categoryId = categoryId;
    else where.categoryId = null;
    let budget = await Budget.findOne({ where });
    if (budget) {
      budget.amount = amount;
      if (warnPercent) budget.warnPercent = warnPercent;
      await budget.save();
      res.json({ code: 0, data: budget, message: '预算更新成功' });
    } else {
      budget = await Budget.create({ bookId, categoryId: categoryId || null, amount, month: 'all', warnPercent: warnPercent || 80 });
      res.json({ code: 0, data: budget, message: '预算创建成功' });
    }
  } catch (err) { next(err); }
};

exports.getBudgets = async (req, res, next) => {
  try {
    const { bookId, month } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    // 查询该账本的所有预算，按 categoryId 去重
    const allBudgets = await Budget.findAll({
      where: { bookId },
      include: [{ model: Category, attributes: ['id', 'name', 'icon'] }],
      order: [['month', 'ASC']]
    });
    const seen = new Set();
    const budgets = [];
    for (const b of allBudgets) {
      const key = String(b.categoryId || 'null');
      if (!seen.has(key)) {
        seen.add(key);
        budgets.push(b);
      }
    }

    // 批量获取所有分类的实际花费，避免 N+1 查询
    const categoryIds = budgets.map(b => b.categoryId).filter(Boolean);
    const spentWhere = { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: month } };
    const [spentByCategory, totalSpent] = await Promise.all([
      categoryIds.length > 0 ? Transaction.findAll({
        attributes: ['categoryId', [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
        where: { ...spentWhere, categoryId: { [Op.in]: categoryIds } },
        group: ['categoryId'],
        raw: true
      }) : [],
      Transaction.sum('amount', { where: { ...spentWhere, categoryId: { [Op.not]: null } } })
    ]);
    const spentMap = Object.fromEntries(spentByCategory.map(s => [s.categoryId, parseFloat(s.total)]));

    const data = budgets.map(b => {
      const spent = b.categoryId ? (spentMap[b.categoryId] || 0) : (parseFloat(totalSpent || 0));
      const percent = b.amount > 0 ? Math.round((spent / parseFloat(b.amount)) * 100) : 0;
      return { ...b.toJSON(), spent, percent };
    });
    res.json({ code: 0, data });
  } catch (err) { next(err); }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    if (!budget) return res.status(404).json({ code: 404, message: '预算不存在' });
    if (!await verifyBookAccess(budget.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    await budget.destroy();
    res.json({ code: 0, message: '预算已删除' });
  } catch (err) { next(err); }
};

// ===== 定时记账 =====
exports.createRecurringBill = async (req, res, next) => {
  try {
    const data = (({ bookId, name, type, amount, categoryId, frequency, dayOfMonth, dayOfWeek, monthOfYear, triggerTime, startDate, endDate, note }) => ({ bookId, name, type, amount, categoryId, frequency, dayOfMonth, dayOfWeek, monthOfYear, triggerTime, startDate, endDate, note }))(req.body);
    // 验证账本访问权限
    if (!await verifyBookAccess(data.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    data.nextRunDate = calcNextRunDate(data);
    const bill = await RecurringBill.create(data);
    res.status(201).json({ code: 0, data: bill, message: '定时任务创建成功' });
  } catch (err) { next(err); }
};

exports.getRecurringBills = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.bookId) {
      // 验证账本访问权限
      if (!await verifyBookAccess(req.query.bookId, req.userId)) {
        return res.status(403).json({ code: 403, message: '无权访问该账本' });
      }
      where.bookId = req.query.bookId;
    }
    if (req.query.active !== undefined) where.active = req.query.active === 'true';
    const bills = await RecurringBill.findAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'type'] }],
      order: [['active', 'DESC'], ['next_run_date', 'ASC']]
    });
    res.json({ code: 0, data: bills });
  } catch (err) { next(err); }
};

exports.updateRecurringBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await RecurringBill.findByPk(id);
    if (!existing) return res.status(404).json({ code: 404, message: '定时任务不存在' });
    if (!await verifyBookAccess(existing.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    const data = (({ name, type, amount, categoryId, frequency, dayOfMonth, dayOfWeek, monthOfYear, triggerTime, startDate, endDate, note, active }) => ({ name, type, amount, categoryId, frequency, dayOfMonth, dayOfWeek, monthOfYear, triggerTime, startDate, endDate, note, active }))(req.body);
    // 如果修改了频率相关字段，重新计算下次执行日期
    if (data.frequency || data.dayOfMonth || data.dayOfWeek || data.monthOfYear) {
      const merged = { ...existing.toJSON(), ...data };
      data.nextRunDate = calcNextRunDate(merged);
    }
    await RecurringBill.update(data, { where: { id } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteRecurringBill = async (req, res, next) => {
  try {
    const bill = await RecurringBill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ code: 404, message: '定时任务不存在' });
    if (!await verifyBookAccess(bill.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    await bill.destroy();
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

exports.toggleRecurringBill = async (req, res, next) => {
  try {
    const bill = await RecurringBill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ code: 404, message: '任务不存在' });
    if (!await verifyBookAccess(bill.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    bill.active = !bill.active;
    if (bill.active) {
      bill.nextRunDate = calcNextRunDate(bill.toJSON());
    }
    await bill.save();
    res.json({ code: 0, data: bill, message: bill.active ? '已启用' : '已暂停' });
  } catch (err) { next(err); }
};

exports.triggerRecurringBill = async (req, res, next) => {
  try {
    const bill = await RecurringBill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ code: 404, message: '任务不存在' });
    if (!await verifyBookAccess(bill.bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    const today = dayjs().format('YYYY-MM-DD');
    const txn = await Transaction.create({
      bookId: bill.bookId,
      type: bill.type,
      amount: bill.amount,
      categoryId: bill.categoryId,
      note: `[定时] ${bill.name}${bill.note ? ' - ' + bill.note : ''}`,
      transactionDate: today,
      createdBy: req.userId,
      source: 'manual'
    });
    bill.lastRunDate = today;
    bill.totalRuns = (bill.totalRuns || 0) + 1;
    bill.nextRunDate = calcNextRunDate(bill.toJSON());
    await bill.save();
    res.json({ code: 0, data: txn, message: '已手动触发记账' });
  } catch (err) { next(err); }
};

// ===== 报表 =====
exports.getDailyReport = async (req, res, next) => {
  try {
    const { bookId, year, month } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const ym = year + '-' + String(month).padStart(2, '0');
    const daysInMonth = dayjs(ym + '-01').daysInMonth();
    const txns = await Transaction.findAll({
      where: { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: ym } },
      attributes: [
        [sequelize.fn('DAY', sequelize.col('transaction_date')), 'day'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: [sequelize.fn('DAY', sequelize.col('transaction_date'))],
      raw: true
    });
    const map = {};
    txns.forEach(r => { map[parseInt(r.day)] = parseFloat(r.total); });
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      data.push({ day: d, expense: map[d] || 0 });
    }
    res.json({ code: 0, data });
  } catch (err) { next(err); }
};

exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { bookId, year, month } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const ym = year + '-' + String(month).padStart(2, '0');
    const income = await Transaction.sum('amount', { where: { bookId, type: 'income', status: 'normal', transactionDate: { [Op.startsWith]: ym } } });
    const expense = await Transaction.sum('amount', { where: { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: ym } } });
    // 按一级分类聚合
    const txns = await Transaction.findAll({
      where: { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: ym } },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'icon', 'parentId'],
        include: [{ model: Category, as: 'parent', attributes: ['id', 'name', 'icon'] }]
      }],
      attributes: ['category_id', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['category_id']
    });
    const parentMap = {};
    txns.forEach(t => {
      const cat = t.Category;
      if (!cat) return;
      const parent = cat.parentId ? cat.parent : cat;
      const key = parent ? parent.id : cat.id;
      const name = parent ? parent.name : cat.name;
      const icon = parent ? parent.icon : cat.icon;
      if (!parentMap[key]) parentMap[key] = { id: key, name, icon, total: 0 };
      parentMap[key].total += parseFloat(t.dataValues.total || 0);
    });
    const byCategory = Object.values(parentMap).sort((a, b) => b.total - a.total);
    res.json({ code: 0, data: { income: parseFloat(income || 0), expense: parseFloat(expense || 0), byCategory } });
  } catch (err) { next(err); }
};

exports.getYearlyReport = async (req, res, next) => {
  try {
    const { bookId, year } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    // 单次聚合查询替代 24 次循环查询
    const txns = await Transaction.findAll({
      where: { bookId, status: 'normal', transactionDate: { [Op.startsWith]: year + '-' } },
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('transaction_date')), 'month'],
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: [sequelize.fn('MONTH', sequelize.col('transaction_date')), 'type'],
      raw: true
    });
    // 组装结果
    const monthMap = {};
    for (let m = 1; m <= 12; m++) monthMap[m] = { month: m, income: 0, expense: 0 };
    txns.forEach(r => {
      const m = parseInt(r.month);
      if (r.type === 'income') monthMap[m].income = parseFloat(r.total);
      else if (r.type === 'expense') monthMap[m].expense = parseFloat(r.total);
    });
    res.json({ code: 0, data: Object.values(monthMap) });
  } catch (err) { next(err); }
};

exports.getYearlyCategoryReport = async (req, res, next) => {
  try {
    const { bookId, year } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const ymPrefix = year + '-';
    // 查找所有支出交易，包含分类及其父分类
    const txns = await Transaction.findAll({
      where: { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: ymPrefix } },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'icon', 'parentId'],
        include: [{ model: Category, as: 'parent', attributes: ['id', 'name', 'icon'] }]
      }],
      attributes: ['category_id', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['category_id']
    });
    // 按一级分类聚合
    const parentMap = {};
    txns.forEach(t => {
      const cat = t.Category;
      if (!cat) return;
      const parent = cat.parentId ? cat.parent : cat;
      const key = parent ? parent.id : cat.id;
      const name = parent ? parent.name : cat.name;
      const icon = parent ? parent.icon : cat.icon;
      if (!parentMap[key]) parentMap[key] = { id: key, name, icon, total: 0 };
      parentMap[key].total += parseFloat(t.dataValues.total || 0);
    });
    const byCategory = Object.values(parentMap).sort((a, b) => b.total - a.total);
    // 年度总支出
    const totalExpense = byCategory.reduce((s, c) => s + c.total, 0);
    res.json({ code: 0, data: { totalExpense, byCategory } });
  } catch (err) { next(err); }
};

exports.getYearlyCategoryMatrix = async (req, res, next) => {
  try {
    const { bookId, year } = req.query;
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const ymPrefix = year + '-';
    // 先查出该年所有支出交易（不 raw，保留关联对象）
    const txns = await Transaction.findAll({
      where: { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: ymPrefix } },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'icon', 'parentId'],
        include: [{ model: Category, as: 'parent', attributes: ['id', 'name', 'icon'] }]
      }],
      attributes: ['category_id', 'transactionDate', 'amount'],
      raw: true,
      nest: true
    });
    // 手动按 category + month 聚合
    const aggMap = {}; // `${catId}_${month}` -> total
    txns.forEach(r => {
      const catId = r.category_id;
      const month = new Date(r.transactionDate).getMonth() + 1;
      const key = catId + '_' + month;
      aggMap[key] = (aggMap[key] || 0) + parseFloat(r.amount || 0);
    });
    // 去重获取所有涉及的分类ID，批量查分类信息
    const catIds = [...new Set(txns.map(r => r.category_id))];
    if (catIds.length === 0) return res.json({ code: 0, data: [] });
    const allCats = await Category.findAll({
      where: { id: { [Op.in]: catIds } },
      attributes: ['id', 'name', 'icon', 'parentId'],
      raw: true
    });
    const catMap = {};
    allCats.forEach(c => { catMap[c.id] = c; });
    // 补充查父分类名称
    const parentIds = [...new Set(allCats.filter(c => c.parentId).map(c => c.parentId))];
    const parentCats = parentIds.length ? await Category.findAll({
      where: { id: { [Op.in]: parentIds } },
      attributes: ['id', 'name', 'icon'],
      raw: true
    }) : [];
    const parentInfoMap = {};
    parentCats.forEach(c => { parentInfoMap[c.id] = c; });
    // 组装：parentCategory -> childCategory -> { m1..m12 }
    const parentMap = {};
    allCats.forEach(c => {
      const isParent = !c.parentId;
      const parentId = isParent ? c.id : c.parentId;
      const pInfo = isParent ? c : (parentInfoMap[c.parentId] || { id: c.parentId, name: '其他', icon: '' });
      if (!parentMap[parentId]) parentMap[parentId] = { id: parentId, name: pInfo.name, icon: pInfo.icon, children: {} };
      if (!parentMap[parentId].children[c.id]) {
        parentMap[parentId].children[c.id] = { id: c.id, name: c.name, icon: c.icon, months: {} };
      }
    });
    // 填充月度数据
    Object.keys(aggMap).forEach(key => {
      const [catIdStr, monthStr] = key.split('_');
      const catId = parseInt(catIdStr);
      const month = parseInt(monthStr);
      const cat = catMap[catId];
      if (!cat) return;
      const parentId = cat.parentId || catId;
      if (parentMap[parentId] && parentMap[parentId].children[catId]) {
        parentMap[parentId].children[catId].months[month] = (parentMap[parentId].children[catId].months[month] || 0) + aggMap[key];
      }
    });
    // 转换为数组并排序
    const categories = Object.values(parentMap).map(p => ({
      id: p.id, name: p.name, icon: p.icon,
      children: Object.values(p.children).map(c => {
        const row = { id: c.id, name: c.name, icon: c.icon };
        let rowTotal = 0;
        for (let m = 1; m <= 12; m++) {
          row[`m${m}`] = c.months[m] || 0;
          rowTotal += row[`m${m}`];
        }
        row.total = rowTotal;
        return row;
      }).sort((a, b) => b.total - a.total)
    })).sort((a, b) => {
      const aTotal = a.children.reduce((s, c) => s + c.total, 0);
      const bTotal = b.children.reduce((s, c) => s + c.total, 0);
      return bTotal - aTotal;
    });
    res.json({ code: 0, data: categories });
  } catch (err) { next(err); }
};

exports.exportReport = async (req, res, next) => {
  try {
    const { bookId, startDate, endDate, format } = req.query;
    // 验证账本访问权限
    if (!await verifyBookAccess(bookId, req.userId)) {
      return res.status(403).json({ code: 403, message: '无权访问该账本' });
    }
    const txns = await Transaction.findAll({
      where: { bookId, status: 'normal', transactionDate: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['transaction_date', 'DESC']]
    });
    const data = txns.map(t => ({ 日期: t.transactionDate, 类型: t.type === 'income' ? '收入' : '支出', 金额: parseFloat(t.amount), 分类: t.Category?.name || '-', 备注: t.note || '' }));
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, '账单');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=bill_' + startDate + '_' + endDate + '.xlsx');
      res.send(buf);
    } else {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=bill_' + startDate + '_' + endDate + '.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('家庭账单报表', { align: 'center' });
      doc.moveDown();
      data.forEach((row, i) => {
        doc.fontSize(10).text((i + 1) + '. ' + row.日期 + ' | ' + row.类型 + ' | ¥' + row.金额.toFixed(2) + ' | ' + row.分类 + ' | ' + row.备注);
      });
      doc.end();
    }
  } catch (err) { next(err); }
};

// ===== 辅助函数 =====
async function checkBudgetWarning(bookId, type, categoryId, userId) {
  if (type !== 'expense') return;
  const month = dayjs().format('YYYY-MM');
  const budgets = await Budget.findAll({ where: { bookId, [Op.or]: [{ categoryId }, { categoryId: null }], [Op.or]: [{ month }, { month: 'all' }] } });
  if (budgets.length === 0) return;

  // 批量查询所有相关分类的花费
  const catIds = [...new Set(budgets.map(b => b.categoryId).filter(Boolean))];
  const spentWhere = { bookId, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: month } };
  const [spentByCategory, totalSpent] = await Promise.all([
    catIds.length > 0 ? Transaction.findAll({
      attributes: ['categoryId', [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
      where: { ...spentWhere, categoryId: { [Op.in]: catIds } },
      group: ['categoryId'],
      raw: true
    }) : [],
    Transaction.sum('amount', { where: spentWhere })
  ]);
  const spentMap = Object.fromEntries(spentByCategory.map(s => [s.categoryId, parseFloat(s.total)]));

  for (const budget of budgets) {
    const spent = budget.categoryId ? (spentMap[budget.categoryId] || 0) : (parseFloat(totalSpent || 0));
    const percent = budget.amount > 0 ? (spent / parseFloat(budget.amount)) * 100 : 0;
    if (percent >= budget.warnPercent) {
      await Notification.create({
        userId, type: 'budget_warning', title: '预算超支预警',
        content: (budget.categoryId ? '该分类' : '总') + '预算已使用' + Math.round(percent) + '%',
        relatedId: budget.id, relatedType: 'budget'
      });
    }
  }
}

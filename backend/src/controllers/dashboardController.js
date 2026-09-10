const { Transaction, AccountBook, Budget, Item, Space, Photo, Album, Notification, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

exports.getDashboard = async (req, res, next) => {
  try {
    const { familyId, bookId } = req.query;
    const userId = req.userId;
    const month = dayjs().format('YYYY-MM');
    const today = dayjs().format('YYYY-MM-DD');
    const in7Days = dayjs().add(7, 'day').format('YYYY-MM-DD');

    // 确定账本范围
    let bookIds;
    if (bookId) {
      bookIds = [parseInt(bookId)];
    } else {
      const books = await AccountBook.findAll({ where: { [Op.or]: [{ familyId }, { userId, type: 'personal' }] }, attributes: ['id'] });
      bookIds = books.map(b => b.id);
    }

    const bookIdFilter = { [Op.in]: bookIds };

    // 所有查询并行执行（单轮 Promise.all）
    const [
      monthlyIncome, monthlyExpense, todayExpense,
      todayTransactions, budgets, spentByCategory,
      albums, spaces, notifications, recentCategories
    ] = await Promise.all([
      Transaction.sum('amount', { where: { bookId: bookIdFilter, type: 'income', status: 'normal', transactionDate: { [Op.startsWith]: month } } }),
      Transaction.sum('amount', { where: { bookId: bookIdFilter, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: month } } }),
      Transaction.sum('amount', { where: { bookId: bookIdFilter, type: 'expense', status: 'normal', transactionDate: today } }),
      Transaction.findAll({
        where: { bookId: bookIdFilter, status: 'normal', transactionDate: today },
        include: [{ model: Category, attributes: ['id', 'name', 'icon', 'type'] }],
        order: [['created_at', 'DESC']]
      }),
      Budget.findAll({ where: { bookId: bookIdFilter, month } }),
      Transaction.findAll({
        where: { bookId: bookIdFilter, type: 'expense', status: 'normal', transactionDate: { [Op.startsWith]: month } },
        attributes: ['categoryId', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
        group: ['categoryId'],
        raw: true
      }).catch(() => []),
      Album.findAll({ where: { familyId }, attributes: ['id'] }),
      Space.findAll({ where: { familyId }, attributes: ['id'] }),
      Notification.findAll({ where: { userId, isRead: false }, order: [['created_at', 'DESC']], limit: 5 }),
      Transaction.findAll({
        where: { createdBy: userId, status: 'normal' },
        include: [{ model: Category, attributes: ['id', 'name', 'icon', 'type'] }],
        attributes: ['category_id', [sequelize.fn('MAX', sequelize.col('transaction_date')), 'lastDate']],
        group: ['category_id'],
        order: [[sequelize.literal('MAX(transaction_date)'), 'DESC']],
        limit: 6
      }).catch(() => [])
    ]);

    // 预算计算
    let totalBudget = 0, totalSpent = 0, budgetPercent = 0;
    if (budgets.length > 0) {
      totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
      const spentMap = Object.fromEntries(spentByCategory.map(r => [r.categoryId, parseFloat(r.total)]));
      for (const b of budgets) {
        totalSpent += spentMap[b.categoryId] || 0;
      }
      budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    }

    // 照片统计
    const albumIds = albums.map(a => a.id);
    const albumIdFilter = albumIds.length > 0 ? { [Op.in]: albumIds } : { [Op.in]: [-1] };
    const [totalPhotos, recentPhotos] = await Promise.all([
      Photo.count({ where: { albumId: albumIdFilter, isDeleted: false } }),
      Photo.findAll({ where: { albumId: albumIdFilter, isDeleted: false }, order: [['created_at', 'DESC']], limit: 9 })
    ]);

    // 物品统计
    const spaceIds = spaces.map(s => s.id);
    const spaceIdFilter = spaceIds.length > 0 ? { [Op.in]: spaceIds } : { [Op.in]: [-1] };
    const [totalItems, expiringItems] = await Promise.all([
      Item.count({ where: { spaceId: spaceIdFilter, status: 'active' } }),
      Item.count({ where: { spaceId: spaceIdFilter, status: 'active', expiryDate: { [Op.between]: [today, in7Days] } } })
    ]);

    res.json({ code: 0, data: {
      accounting: { monthlyIncome: parseFloat(monthlyIncome || 0), monthlyExpense: parseFloat(monthlyExpense || 0), todayExpense: parseFloat(todayExpense || 0), budgetPercent, todayTransactions },
      album: { totalPhotos, recentPhotos },
      inventory: { totalItems, expiringItems },
      notifications,
      recentCategories
    }});
  } catch (err) { next(err); }
};

// 标记单条通知已读
exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ code: 404, message: '通知不存在' });
    if (notification.userId !== req.userId) return res.status(403).json({ code: 403, message: '无权限操作' });
    await notification.update({ isRead: true });
    res.json({ code: 0, message: '已标记已读' });
  } catch (err) { next(err); }
};

// 标记所有通知已读
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.userId, isRead: false } });
    res.json({ code: 0, message: '全部已读' });
  } catch (err) { next(err); }
};

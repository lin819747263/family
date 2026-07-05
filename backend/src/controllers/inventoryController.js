const { Space, Item, ItemBorrow, User, Notification } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ===== 空间管理 =====
exports.createSpace = async (req, res, next) => {
  try {
    const allowed = (({ name, icon, level, parentId, sort }) => ({ name, icon, level, parentId, sort }))(req.body);
    const space = await Space.create({ ...allowed, familyId: req.body.familyId });
    res.status(201).json({ code: 0, data: space, message: '创建成功' });
  } catch (err) { next(err); }
};

// 加载空间树并统计物品数量（优化：2次查询代替 N+1）
async function loadSpaceTree(familyId) {
  const [allSpaces, itemCounts] = await Promise.all([
    Space.findAll({ where: { familyId }, order: [['sort', 'ASC']], raw: true }),
    Item.findAll({
      attributes: ['spaceId', [Item.sequelize.fn('COUNT', Item.sequelize.col('id')), 'count']],
      where: { status: 'active' },
      group: ['spaceId'],
      raw: true
    })
  ]);

  const countMap = Object.fromEntries(itemCounts.map(s => [s.spaceId, parseInt(s.count)]));
  const spaceMap = new Map();
  for (const s of allSpaces) {
    s.children = [];
    s.itemCount = countMap[s.id] || 0;
    spaceMap.set(s.id, s);
  }

  const roots = [];
  for (const s of allSpaces) {
    if (s.parentId) {
      const parent = spaceMap.get(s.parentId);
      if (parent) parent.children.push(s);
    } else {
      roots.push(s);
    }
  }
  return roots;
}

exports.getSpaces = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const spaces = await loadSpaceTree(familyId);
    res.json({ code: 0, data: spaces });
  } catch (err) { next(err); }
};

exports.updateSpace = async (req, res, next) => {
  try {
    const allowed = (({ name, icon, sort }) => ({ name, icon, sort }))(req.body);
    await Space.update(allowed, { where: { id: req.params.id } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteSpace = async (req, res, next) => {
  try {
    const children = await Space.count({ where: { parentId: req.params.id } });
    const items = await Item.count({ where: { spaceId: req.params.id, status: 'active' } });
    if (children > 0 || items > 0) return res.status(400).json({ code: 400, message: '请先清空子空间和物品' });
    await Space.destroy({ where: { id: req.params.id } });
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { next(err); }
};

// ===== 物品管理 =====
exports.createItem = async (req, res, next) => {
  try {
    const allowed = (({ name, description, quantity, price, category, tags, spaceId, purchaseDate, warrantyMonths, expiryDate, lastUsedDate, photos }) => ({ name, description, quantity, price, category, tags, spaceId, purchaseDate, warrantyMonths, expiryDate, lastUsedDate, photos }))(req.body);
    const item = await Item.create({ ...allowed, createdBy: req.userId });
    // 检查是否需要提醒
    if (item.expiryDate) await checkExpiryReminder(item, req.userId);
    if (item.warrantyMonths) await checkWarrantyReminder(item, req.userId);
    res.status(201).json({ code: 0, data: item, message: '物品添加成功' });
  } catch (err) { next(err); }
};

exports.getItems = async (req, res, next) => {
  try {
    const { spaceId, category, search, status, page = 1, pageSize = 20 } = req.query;
    const where = { status: 'active' };
    if (spaceId) where.spaceId = spaceId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: '%' + search + '%' } },
        { tags: { [Op.like]: '%' + search + '%' } },
        { description: { [Op.like]: '%' + search + '%' } }
      ];
    }
    const { count, rows } = await Item.findAndCountAll({
      where,
      include: [
        { model: Space, attributes: ['id', 'name', 'level', 'parentId'] },
        { model: User, as: 'creator', attributes: ['id', 'nickname'] }
      ],
      order: [['updated_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ code: 404, message: '物品不存在' });
    // 检查权限：只能修改自己创建的物品
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能修改自己创建的物品' });
    const allowed = (({ name, description, quantity, price, category, tags, spaceId, purchaseDate, warrantyMonths, expiryDate, lastUsedDate, status, photos }) => ({ name, description, quantity, price, category, tags, spaceId, purchaseDate, warrantyMonths, expiryDate, lastUsedDate, status, photos }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ code: 404, message: '物品不存在' });
    // 检查权限：只能删除自己创建的物品
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能删除自己创建的物品' });
    await item.update({ status: 'discarded' });
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { next(err); }
};

// ===== 借物管理 =====
exports.createBorrow = async (req, res, next) => {
  try {
    const { itemId, borrowedBy, expectedReturnDate, note } = req.body;
    const item = await Item.findByPk(itemId);
    if (!item || item.status !== 'active') return res.status(400).json({ code: 400, message: '物品不可借用' });
    const borrow = await ItemBorrow.create({
      itemId, borrowedBy, lentBy: req.userId,
      borrowDate: dayjs().format('YYYY-MM-DD'), expectedReturnDate, note
    });
    res.status(201).json({ code: 0, data: borrow, message: '借出登记成功' });
  } catch (err) { next(err); }
};

exports.getBorrows = async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { [Op.or]: [{ lentBy: req.userId }, { borrowedBy: req.userId }] };
    if (status) where.status = status;
    const { count, rows } = await ItemBorrow.findAndCountAll({
      where, include: [
        { model: Item, attributes: ['id', 'name', 'photos'] },
        { model: User, as: 'borrower', attributes: ['id', 'nickname', 'avatar'] },
        { model: User, as: 'lender', attributes: ['id', 'nickname', 'avatar'] }
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize, limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.returnBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const borrow = await ItemBorrow.findByPk(id);
    if (!borrow) return res.status(404).json({ code: 404, message: '借出记录不存在' });
    // 只有借出者或归还者可以操作
    if (borrow.borrowedBy !== req.userId && borrow.lentBy !== req.userId) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }
    borrow.status = 'returned';
    borrow.returnDate = dayjs().format('YYYY-MM-DD');
    await borrow.save();
    res.json({ code: 0, message: '已归还' });
  } catch (err) { next(err); }
};

exports.remindBorrow = async (req, res, next) => {
  try {
    const borrow = await ItemBorrow.findByPk(req.params.id, { include: [{ model: Item, attributes: ['name'] }, { model: User, as: 'borrower', attributes: ['id'] }] });
    if (!borrow) return res.status(404).json({ code: 404, message: '借出记录不存在' });
    await Notification.create({
      userId: borrow.borrower.id, type: 'reminder', title: '物品催还提醒',
      content: `请归还借出的"${borrow.Item?.name}"`, relatedId: borrow.id, relatedType: 'borrow'
    });
    res.json({ code: 0, message: '催还通知已发送' });
  } catch (err) { next(err); }
};

// ===== 断舍离助手 =====
exports.getUnusedItems = async (req, res, next) => {
  try {
    const { familyId, months = 12 } = req.query;
    const oneYearAgo = dayjs().subtract(months, 'month').format('YYYY-MM-DD');
    const spaces = await Space.findAll({ where: { familyId }, attributes: ['id'] });
    const spaceIds = spaces.map(s => s.id);
    const items = await Item.findAll({
      where: {
        spaceId: { [Op.in]: spaceIds }, status: 'active',
        [Op.or]: [
          { lastUsedDate: { [Op.lte]: oneYearAgo } },
          { lastUsedDate: null, createdAt: { [Op.lte]: dayjs().subtract(months, 'month').toDate() } }
        ]
      },
      include: [{ model: Space, attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']]
    });
    res.json({ code: 0, data: items });
  } catch (err) { next(err); }
};

// ===== 提醒功能 =====
exports.getUpcomingReminders = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const spaces = await Space.findAll({ where: { familyId }, attributes: ['id'] });
    const spaceIds = spaces.map(s => s.id);
    if (spaceIds.length === 0) return res.json({ code: 0, data: [] });

    const today = dayjs().format('YYYY-MM-DD');
    const in7Days = dayjs().add(7, 'day').format('YYYY-MM-DD');
    const in1Day = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const reminders = [];

    // 临期物品（食品保质期）
    const expiringItems = await Item.findAll({
      where: { spaceId: { [Op.in]: spaceIds }, status: 'active', expiryDate: { [Op.between]: [today, in7Days] }, [Op.not]: { expiryDate: null } },
      include: [{ model: Space, attributes: ['name'] }]
    });
    for (const item of expiringItems) {
      reminders.push({ type: 'expiry', title: `"${item.name}"即将过期`, date: item.expiryDate, item, urgent: item.expiryDate <= in1Day });
    }

    // 保修到期（只查有 purchaseDate 和 warrantyMonths 的物品）
    const warrantyItems = await Item.findAll({
      where: {
        spaceId: { [Op.in]: spaceIds }, status: 'active',
        purchaseDate: { [Op.not]: null },
        warrantyMonths: { [Op.not]: null, [Op.gt]: 0 }
      },
      attributes: ['id', 'name', 'purchaseDate', 'warrantyMonths'],
      include: [{ model: Space, attributes: ['name'] }]
    });
    for (const item of warrantyItems) {
      const warrantyEnd = dayjs(item.purchaseDate).add(item.warrantyMonths, 'month').format('YYYY-MM-DD');
      if (warrantyEnd >= today && warrantyEnd <= in7Days) {
        reminders.push({ type: 'warranty', title: `"${item.name}"保修即将到期`, date: warrantyEnd, item });
      }
    }
    res.json({ code: 0, data: reminders });
  } catch (err) { next(err); }
};

// ===== 辅助函数 =====
async function checkExpiryReminder(item, userId) {
  const daysUntilExpiry = dayjs(item.expiryDate).diff(dayjs(), 'day');
  if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
    await Notification.create({ userId, type: 'expiry', title: '物品临期提醒', content: `"${item.name}"将于${daysUntilExpiry}天后过期`, relatedId: item.id, relatedType: 'item' });
  }
}

async function checkWarrantyReminder(item, userId) {
  const warrantyEnd = dayjs(item.purchaseDate).add(item.warrantyMonths, 'month');
  const daysLeft = warrantyEnd.diff(dayjs(), 'day');
  if (daysLeft <= 7 && daysLeft >= 0) {
    await Notification.create({ userId, type: 'warranty', title: '保修到期提醒', content: `"${item.name}"保修期还有${daysLeft}天`, relatedId: item.id, relatedType: 'item' });
  }
}

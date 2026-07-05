require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const { seedDb, loadDb, saveDb, nextId } = require("./src/db/seed");
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_2024";
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
let db = seedDb();
function persist() { saveDb(db); }
function find(arr, { where, order, limit, offset } = {}) {
  let result = [...arr];
  if (where) result = result.filter(item => Object.entries(where).every(([k, v]) => {
    if (k === "$or") return v.some(c => Object.entries(c).every(([kk, vv]) => item[kk] === vv));
    if (k === "$and") return v.every(c => Object.entries(c).every(([kk, vv]) => item[kk] === vv));
    if (v && typeof v === "object") {
      if (v.$startsWith !== void 0) return String(item[k]).startsWith(v.$startsWith);
      if (v.$like !== void 0) return new RegExp(v.$like.replace(/%/g, ".*"), "i").test(String(item[k]));
      if (v.$gte !== void 0 && v.$lte !== void 0) return item[k] >= v.$gte && item[k] <= v.$lte;
      if (v.$gte !== void 0) return item[k] >= v.$gte;
      if (v.$lte !== void 0) return item[k] <= v.$lte;
      if (v.$ne !== void 0) return item[k] !== v.$ne;
      if (v.$in !== void 0) return v.$in.includes(item[k]);
      if (v.$between !== void 0) return item[k] >= v.$between[0] && item[k] <= v.$between[1];
    }
    return item[k] === v;
  }));
  const total = result.length;
  if (order && order.length) {
    const [field, dir] = Array.isArray(order[0]) ? order[0] : order;
    result.sort((a, b) => dir === "DESC" ? (b[field] || "").toString().localeCompare((a[field] || "").toString()) : (a[field] || "").toString().localeCompare((b[field] || "").toString()));
  }
  if (limit) result = result.slice(0, parseInt(limit));
  if (offset) result = result.slice(parseInt(offset));
  return { rows: result, count: total };
}
function findOne(arr, opts) { const r = find(arr, { ...opts, limit: 1 }); return r.rows[0] || null; }
function sumArr(arr, where, field) {
  return arr.filter(item => { if (!where) return true; return Object.entries(where).every(([k, v]) => { if (v && typeof v === "object" && v.$startsWith !== void 0) return String(item[k]).startsWith(v.$startsWith); if (v && typeof v === "object" && v.$in !== void 0) return v.$in.includes(item[k]); if (v && typeof v === "object" && v.$ne !== void 0) return item[k] !== v.$ne; if (v && typeof v === "object" && v.$between !== void 0) return item[k] >= v.$between[0] && item[k] <= v.$between[1]; return item[k] === v; }); }).reduce((s, i) => s + parseFloat(i[field || "amount"] || 0), 0);
}
function groupBy(arr, where, field) {
  const r = arr.filter(item => { if (!where) return true; return Object.entries(where).every(([k, v]) => { if (v && typeof v === "object" && v.$startsWith !== void 0) return String(item[k]).startsWith(v.$startsWith); return item[k] === v; }); });
  const groups = {};
  r.forEach(item => { const key = item[field || "categoryId"]; if (!groups[key]) groups[key] = []; groups[key].push(item); });
  return Object.entries(groups).map(([k, items]) => ({ category_id: parseInt(k), total: items.reduce((s, i) => s + parseFloat(i.amount || 0), 0).toFixed(2), Category: db.categories.find(c => c.id === parseInt(k)) }));
}
function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ code: 401, message: "未登录" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.userId && u.status === "active");
    if (!user) return res.status(401).json({ code: 401, message: "用户不存在" });
    req.userId = user.id; req.user = { ...user }; delete req.user.password; next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ code: 401, message: "登录已过期" });
    return res.status(401).json({ code: 401, message: "身份验证失败" });
  }
}
// ===== Auth Routes =====
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.status === "active");
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ code: 400, message: "用户名或密码错误" });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  const { password: _, ...userData } = user;
  res.json({ code: 0, data: { token, user: userData } });
});
app.post("/api/auth/register", (req, res) => {
  if (db.users.find(u => u.username === req.body.username)) return res.status(400).json({ code: 400, message: "用户名已存在" });
  const user = { id: nextId(db.users), username: req.body.username, password: bcrypt.hashSync(req.body.password, 10), nickname: req.body.nickname || req.body.username, role: "member", theme: "light", fontSize: "normal", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.users.push(user);
  if (req.body.familyName) {
    const f = { id: nextId(db.families), name: req.body.familyName, inviteCode: Math.random().toString(36).slice(2,10), createdBy: user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.families.push(f);
    db.familyMembers.push({ id: nextId(db.familyMembers), familyId: f.id, userId: user.id, role: "owner", nickname: user.nickname, joinedAt: new Date().toISOString() });
  }
  persist(); const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  const { password: _, ...ud } = user;
  res.status(201).json({ code: 0, data: { token, user: ud } });
});
app.get("/api/auth/profile", authenticate, (req, res) => {
  const families = db.familyMembers.filter(fm => fm.userId === req.userId).map(fm => ({ ...db.families.find(f => f.id === fm.familyId), FamilyMember: fm }));
  res.json({ code: 0, data: { user: req.user, families } });
});
app.put("/api/auth/profile", authenticate, (req, res) => { Object.assign(db.users.find(u => u.id === req.userId), req.body); persist(); res.json({ code: 0, message: "更新成功" }); });
app.put("/api/auth/password", authenticate, (req, res) => {
  const u = db.users.find(u => u.id === req.userId);
  if (!bcrypt.compareSync(req.body.oldPassword, u.password)) return res.status(400).json({ code: 400, message: "原密码错误" });
  u.password = bcrypt.hashSync(req.body.newPassword, 10); persist(); res.json({ code: 0, message: "修改成功" });
});
app.post("/api/auth/family/join", authenticate, (req, res) => {
  const family = db.families.find(f => f.inviteCode === req.body.inviteCode);
  if (!family) return res.status(404).json({ code: 404, message: "邀请码无效" });
  if (db.familyMembers.find(fm => fm.familyId === family.id && fm.userId === req.userId)) return res.status(400).json({ code: 400, message: "已加入" });
  db.familyMembers.push({ id: nextId(db.familyMembers), familyId: family.id, userId: req.userId, role: "member", nickname: req.user.nickname, joinedAt: new Date().toISOString() });
  persist(); res.json({ code: 0, message: "加入成功" });
});
app.post("/api/auth/family/create", authenticate, (req, res) => {
  const family = { id: nextId(db.families), name: req.body.name, inviteCode: Math.random().toString(36).slice(2,10), createdBy: req.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.families.push(family); db.familyMembers.push({ id: nextId(db.familyMembers), familyId: family.id, userId: req.userId, role: "owner", nickname: req.user.nickname, joinedAt: new Date().toISOString() });
  persist(); res.json({ code: 0, data: family, message: "创建成功" });
});
// ===== Accounting Routes =====
app.post("/api/accounting/books", authenticate, (req, res) => {
  const book = { id: nextId(db.accountBooks), status: "active", ...req.body, userId: req.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.accountBooks.push(book); persist();
  res.status(201).json({ code: 0, data: book });
});
app.get("/api/accounting/books", authenticate, (req, res) => {
  const books = db.accountBooks.filter(b => (b.familyId === parseInt(req.query.familyId) || b.userId === req.userId) && b.status === "active");
  res.json({ code: 0, data: books });
});
app.put("/api/accounting/books/:id", authenticate, (req, res) => {
  const b = db.accountBooks.find(b => b.id === parseInt(req.params.id) && b.userId === req.userId);
  if (b) { Object.assign(b, req.body); persist(); }
  res.json({ code: 0, message: "更新成功" });
});
app.post("/api/accounting/transactions", authenticate, (req, res) => {
  const t = { id: nextId(db.transactions), ...req.body, createdBy: req.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.transactions.push(t); persist();
  res.status(201).json({ code: 0, data: t });
});
app.get("/api/accounting/transactions", authenticate, (req, res) => {
  const { bookId, startDate, endDate, categoryId, type, status, search, page = 1, pageSize = 20 } = req.query;
  let filtered = db.transactions.filter(t => {
    if (parseInt(bookId) && t.bookId !== parseInt(bookId)) return false;
    if (t.status === "deleted") return false;
    if (type && t.type !== type) return false;
    if (categoryId && t.categoryId !== parseInt(categoryId)) return false;
    if (startDate && t.transactionDate < startDate) return false;
    if (endDate && t.transactionDate > endDate) return false;
    if (search && !(t.note || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  filtered.sort((a, b) => b.transactionDate?.localeCompare(a.transactionDate || "") || b.id - a.id);
  let total = filtered.length;
  if (pageSize) filtered = filtered.slice((parseInt(page) - 1) * parseInt(pageSize), parseInt(page) * parseInt(pageSize));
  const list = filtered.map(t => ({ ...t, Category: db.categories.find(c => c.id === t.categoryId) || null }));
  res.json({ code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});
app.put("/api/accounting/transactions/:id", authenticate, (req, res) => {
  const t = db.transactions.find(t => t.id === parseInt(req.params.id));
  if (t) { Object.assign(t, req.body); persist(); }
  res.json({ code: 0, message: "更新成功" });
});
app.delete("/api/accounting/transactions/:id", authenticate, (req, res) => {
  const t = db.transactions.find(t => t.id === parseInt(req.params.id));
  if (t) t.status = "deleted"; persist();
  res.json({ code: 0, message: "删除成功" });
});
app.get("/api/accounting/categories", authenticate, (req, res) => {
  const where = {};
  if (req.query.type) where.type = req.query.type;
  const cats = db.categories.filter(c => c.builtIn || c.familyId === parseInt(req.query.familyId));
  res.json({ code: 0, data: cats });
});
app.post("/api/accounting/categories", authenticate, (req, res) => {
  const c = { id: nextId(db.categories), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.categories.push(c); persist();
  res.status(201).json({ code: 0, data: c });
});
app.post("/api/accounting/budgets", authenticate, (req, res) => {
  const existing = db.budgets.find(b => b.bookId === req.body.bookId && (b.categoryId === (req.body.categoryId || null)) && b.month === req.body.month);
  if (existing) { Object.assign(existing, req.body); } else {
    db.budgets.push({ id: nextId(db.budgets), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  persist(); res.json({ code: 0, message: "预算设置成功" });
});
app.get("/api/accounting/budgets", authenticate, (req, res) => {
  const budgets = db.budgets.filter(b => b.bookId === parseInt(req.query.bookId) && b.month === req.query.month).map(b => {
    const spent = sumArr(db.transactions, { bookId: b.bookId, type: "expense", status: "normal", transactionDate: { $startsWith: b.month }, categoryId: b.categoryId || { $ne: null } }, "amount");
    return { ...b, Category: db.categories.find(c => c.id === b.categoryId) || null, spent: spent.toFixed(2), percent: b.amount > 0 ? Math.round((spent / parseFloat(b.amount)) * 100) : 0 };
  });
  res.json({ code: 0, data: budgets });
});
app.post("/api/accounting/recurring", authenticate, (req, res) => {
  const bill = { id: nextId(db.recurringBills), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.recurringBills.push(bill); persist();
  res.status(201).json({ code: 0, data: bill });
});
app.get("/api/accounting/recurring", authenticate, (req, res) => {
  const bills = db.recurringBills.filter(b => b.bookId === parseInt(req.query.bookId) && b.active !== false);
  res.json({ code: 0, data: bills });
});
app.get("/api/accounting/report/monthly", authenticate, (req, res) => {
  const { bookId, year, month } = req.query;
  const prefix = `${year}-${String(month).padStart(2,"0")}`;
  const income = sumArr(db.transactions, { bookId: parseInt(bookId), type: "income", status: "normal", transactionDate: { $startsWith: prefix } }, "amount");
  const expense = sumArr(db.transactions, { bookId: parseInt(bookId), type: "expense", status: "normal", transactionDate: { $startsWith: prefix } }, "amount");
  const byCategory = groupBy(db.transactions, { bookId: parseInt(bookId), type: "expense", status: "normal", transactionDate: { $startsWith: prefix } }, "categoryId");
  res.json({ code: 0, data: { income, expense, byCategory } });
});
app.get("/api/accounting/report/yearly", authenticate, (req, res) => {
  const { bookId, year } = req.query;
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const prefix = `${year}-${String(m).padStart(2,"0")}`;
    months.push({ month: m, income: sumArr(db.transactions, { bookId: parseInt(bookId), type: "income", status: "normal", transactionDate: { $startsWith: prefix } }, "amount"), expense: sumArr(db.transactions, { bookId: parseInt(bookId), type: "expense", status: "normal", transactionDate: { $startsWith: prefix } }, "amount") });
  }
  res.json({ code: 0, data: months });
});
app.get("/api/accounting/report/yearly-category", authenticate, (req, res) => {
  const { bookId, year } = req.query;
  const prefix = `${year}-`;
  const txns = db.transactions.filter(t => t.bookId === parseInt(bookId) && t.type === "expense" && t.status === "normal" && t.transactionDate?.startsWith(prefix));
  const parentMap = {};
  txns.forEach(t => {
    const cat = db.categories.find(c => c.id === t.categoryId);
    if (!cat) return;
    const parent = cat.parentId ? db.categories.find(c => c.id === cat.parentId) : cat;
    const pid = parent ? parent.id : cat.id;
    if (!parentMap[pid]) parentMap[pid] = { id: pid, name: parent?.name || cat.name, icon: parent?.icon || cat.icon, total: 0 };
    parentMap[pid].total += parseFloat(t.amount || 0);
  });
  const byCategory = Object.values(parentMap).sort((a, b) => b.total - a.total);
  const totalExpense = byCategory.reduce((s, c) => s + c.total, 0);
  res.json({ code: 0, data: { totalExpense, byCategory } });
});
app.get("/api/accounting/report/yearly-category-matrix", authenticate, (req, res) => {
  const { bookId, year } = req.query;
  const prefix = `${year}-`;
  const txns = db.transactions.filter(t => t.bookId === parseInt(bookId) && t.type === "expense" && t.status === "normal" && t.transactionDate?.startsWith(prefix));
  const parentMap = {};
  txns.forEach(t => {
    const cat = db.categories.find(c => c.id === t.categoryId);
    if (!cat) return;
    const isParent = !cat.parentId;
    const parentId = isParent ? cat.id : cat.parentId;
    const pInfo = isParent ? cat : db.categories.find(c => c.id === cat.parentId);
    if (!parentMap[parentId]) parentMap[parentId] = { id: parentId, name: pInfo?.name || '其他', icon: pInfo?.icon || '', children: {} };
    if (!parentMap[parentId].children[cat.id]) parentMap[parentId].children[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, months: {} };
    const month = parseInt(t.transactionDate.slice(5, 7));
    parentMap[parentId].children[cat.id].months[month] = (parentMap[parentId].children[cat.id].months[month] || 0) + parseFloat(t.amount || 0);
  });
  const categories = Object.values(parentMap).map(p => ({
    id: p.id, name: p.name, icon: p.icon,
    children: Object.values(p.children).map(c => {
      const row = { id: c.id, name: c.name, icon: c.icon };
      let rowTotal = 0;
      for (let m = 1; m <= 12; m++) { row[`m${m}`] = c.months[m] || 0; rowTotal += row[`m${m}`]; }
      row.total = rowTotal;
      return row;
    }).sort((a, b) => b.total - a.total)
  })).sort((a, b) => {
    const aT = a.children.reduce((s, c) => s + c.total, 0);
    const bT = b.children.reduce((s, c) => s + c.total, 0);
    return bT - aT;
  });
  res.json({ code: 0, data: categories });
});
app.get("/api/accounting/report/export", authenticate, (req, res) => {
  const { bookId, startDate, endDate } = req.query;
  const txns = db.transactions.filter(t => t.bookId === parseInt(bookId) && t.status === "normal" && t.transactionDate >= startDate && t.transactionDate <= endDate);
  const data = txns.map(t => ({ 日期: t.transactionDate, 类型: t.type === "income" ? "收入" : "支出", 金额: parseFloat(t.amount).toFixed(2), 分类: (db.categories.find(c => c.id === t.categoryId) || {}).name || "-", 备注: t.note || "" }));
  const XLSX = require("xlsx");
  const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "账单");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=bill.xlsx");
  res.send(buf);
});
// ===== Album Routes =====
app.post("/api/album/albums", authenticate, (req, res) => {
  const album = { id: nextId(db.albums), ...req.body, createdBy: req.userId, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.albums.push(album); persist();
  res.status(201).json({ code: 0, data: album });
});
app.get("/api/album/albums", authenticate, (req, res) => {
  const albums = db.albums.filter(a => a.familyId === parseInt(req.query.familyId) && a.status === "active").map(a => ({
    ...a, password: !!a.password,
    photoCount: db.photos.filter(p => p.albumId === a.id && !p.isDeleted).length,
    Photos: db.photos.filter(p => p.albumId === a.id && !p.isDeleted).slice(0, 4),
    creator: db.users.find(u => u.id === a.createdBy)
  }));
  res.json({ code: 0, data: albums.sort((a,b) => a.sort - b.sort) });
});
app.post("/api/album/albums/:id/verify", authenticate, (req, res) => {
  res.json({ code: 0, data: { verified: true }, message: "验证通过" });
});
app.put("/api/album/albums/:id", authenticate, (req, res) => {
  const a = db.albums.find(a => a.id === parseInt(req.params.id));
  if (a) Object.assign(a, req.body); persist();
  res.json({ code: 0, message: "更新成功" });
});
app.delete("/api/album/albums/:id", authenticate, (req, res) => {
  const a = db.albums.find(a => a.id === parseInt(req.params.id));
  if (a) a.status = "archived"; persist();
  res.json({ code: 0, message: "删除成功" });
});
app.get("/api/album/photos", authenticate, (req, res) => {
  const { albumId, page = 1, pageSize = 50 } = req.query;
  let photos = db.photos.filter(p => p.albumId === parseInt(albumId) && !p.isDeleted).map(p => ({ ...p, uploader: db.users.find(u => u.id === p.uploadedBy) }));
  const total = photos.length;
  if (pageSize) photos = photos.slice((parseInt(page) - 1) * parseInt(pageSize), parseInt(page) * parseInt(pageSize));
  res.json({ code: 0, data: { list: photos, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});
app.post("/api/album/photos/upload", authenticate, (req, res) => {
  const { albumId } = req.body;
  const photo = { id: nextId(db.photos), albumId: parseInt(albumId), originalName: "photo.jpg", url: "/uploads/photos/placeholder.jpg", thumbnailUrl: "/uploads/photos/thumb_placeholder.jpg", width: 800, height: 600, size: 102400, mimeType: "image/jpeg", uploadedBy: req.userId, isEncrypted: false, isDeleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.photos.push(photo); persist();
  res.status(201).json({ code: 0, data: photo, message: "上传成功" });
});
app.delete("/api/album/photos/:id", authenticate, (req, res) => {
  const p = db.photos.find(p => p.id === parseInt(req.params.id));
  if (p) p.isDeleted = true; persist();
  res.json({ code: 0, message: "删除成功" });
});
app.get("/api/album/comments", authenticate, (req, res) => {
  const comments = db.photoComments.filter(c => c.photoId === parseInt(req.query.photoId)).map(c => ({ ...c, user: db.users.find(u => u.id === c.userId) }));
  res.json({ code: 0, data: comments });
});
app.post("/api/album/comments", authenticate, (req, res) => {
  const c = { id: nextId(db.photoComments), ...req.body, userId: req.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.photoComments.push(c); persist();
  res.status(201).json({ code: 0, data: { ...c, user: { id: req.userId, nickname: req.user.nickname } } });
});
app.post("/api/album/photos/:photoId/like", authenticate, (req, res) => {
  const key = `${req.params.photoId}_${req.userId}`;
  const existing = db.photoLikes?.find(l => l.key === key);
  if (existing) { db.photoLikes = db.photoLikes.filter(l => l.key !== key); persist(); return res.json({ code: 0, data: { liked: false } }); }
  if (!db.photoLikes) db.photoLikes = [];
  db.photoLikes.push({ key, photoId: parseInt(req.params.photoId), userId: req.userId }); persist();
  res.json({ code: 0, data: { liked: true } });
});
app.get("/api/album/storage", authenticate, (req, res) => {
  const spaces = db.storageSpaces.filter(s => s.familyId === parseInt(req.query.familyId));
  const totalUsed = spaces.reduce((s, sp) => s + parseInt(sp.usedBytes || 0), 0);
  const totalLimit = spaces.reduce((s, sp) => s + parseInt(sp.totalBytes || 0), 0);
  res.json({ code: 0, data: { spaces, totalUsed, totalLimit, percent: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0 } });
});
app.get("/api/album/memories", authenticate, (req, res) => {
  const familyPhotos = db.photos.filter(p => {
    const a = db.albums.find(al => al.id === p.albumId);
    return a && a.familyId === parseInt(req.query.familyId) && !p.isDeleted;
  });
  const recent = familyPhotos.sort((a, b) => b.createdAt?.localeCompare(a.createdAt || "") || 0).slice(0, 10);
  res.json({ code: 0, data: { yearAgo: recent.slice(0, 5), weekBest: recent.slice(0, 6) } });
});
// ===== Inventory Routes =====
app.post("/api/inventory/spaces", authenticate, (req, res) => {
  const s = { id: nextId(db.spaces), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.spaces.push(s); persist();
  res.status(201).json({ code: 0, data: s });
});
app.get("/api/inventory/spaces", authenticate, (req, res) => {
  let spaces = db.spaces.filter(s => s.familyId === parseInt(req.query.familyId));
  const buildTree = (parentId) => spaces.filter(s => s.parentId === parentId).map(s => ({ ...s, itemCount: db.items.filter(i => i.spaceId === s.id && i.status === "active").length, children: buildTree(s.id) }));
  const tree = buildTree(null);
  res.json({ code: 0, data: tree });
});
app.put("/api/inventory/spaces/:id", authenticate, (req, res) => {
  const s = db.spaces.find(s => s.id === parseInt(req.params.id));
  if (s) Object.assign(s, req.body); persist();
  res.json({ code: 0, message: "更新成功" });
});
app.delete("/api/inventory/spaces/:id", authenticate, (req, res) => {
  const children = db.spaces.filter(s => s.parentId === parseInt(req.params.id)).length;
  const items = db.items.filter(i => i.spaceId === parseInt(req.params.id) && i.status === "active").length;
  if (children > 0 || items > 0) return res.status(400).json({ code: 400, message: "请先清空子空间和物品" });
  db.spaces = db.spaces.filter(s => s.id !== parseInt(req.params.id)); persist();
  res.json({ code: 0, message: "删除成功" });
});
app.post("/api/inventory/items", authenticate, (req, res) => {
  const item = { id: nextId(db.items), status: "active", ...req.body, createdBy: req.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.items.push(item); persist();
  res.status(201).json({ code: 0, data: item });
});
app.get("/api/inventory/items", authenticate, (req, res) => {
  const { spaceId, category, search, status, page = 1, pageSize = 20 } = req.query;
  let filtered = db.items.filter(i => {
    if (search) { const q = search.toLowerCase(); return i.name.toLowerCase().includes(q) || (i.tags || "").toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q); }
    if (spaceId && i.spaceId !== parseInt(spaceId)) return false;
    if (category && i.category !== category) return false;
    if (status) return i.status === status;
    return i.status === "active";
  });
  const total = filtered.length;
  filtered = filtered.slice((parseInt(page) - 1) * parseInt(pageSize), parseInt(page) * parseInt(pageSize));
  const list = filtered.map(i => ({ ...i, Space: db.spaces.find(s => s.id === i.spaceId), creator: db.users.find(u => u.id === i.createdBy) }));
  res.json({ code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});
app.put("/api/inventory/items/:id", authenticate, (req, res) => {
  const i = db.items.find(i => i.id === parseInt(req.params.id));
  if (i) Object.assign(i, req.body); persist();
  res.json({ code: 0, message: "更新成功" });
});
app.delete("/api/inventory/items/:id", authenticate, (req, res) => {
  const i = db.items.find(i => i.id === parseInt(req.params.id));
  if (i) i.status = "discarded"; persist();
  res.json({ code: 0, message: "删除成功" });
});
app.post("/api/inventory/borrows", authenticate, (req, res) => {
  const b = { id: nextId(db.itemBorrows), ...req.body, lentBy: req.userId, status: "borrowed", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.itemBorrows.push(b); persist();
  res.status(201).json({ code: 0, data: b });
});
app.get("/api/inventory/borrows", authenticate, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  let filtered = db.itemBorrows.filter(b => b.lentBy === req.userId || b.borrowedBy === req.userId);
  if (status) filtered = filtered.filter(b => b.status === status);
  const total = filtered.length;
  const list = filtered.slice((parseInt(page)-1)*parseInt(pageSize), parseInt(page)*parseInt(pageSize)).map(b => ({ ...b, Item: db.items.find(i => i.id === b.itemId), borrower: db.users.find(u => u.id === b.borrowedBy), lender: db.users.find(u => u.id === b.lentBy) }));
  res.json({ code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});
app.put("/api/inventory/borrows/:id/return", authenticate, (req, res) => {
  const b = db.itemBorrows.find(b => b.id === parseInt(req.params.id));
  if (b) { b.status = "returned"; b.returnDate = new Date().toISOString().slice(0,10); } persist();
  res.json({ code: 0, message: "已归还" });
});
app.post("/api/inventory/borrows/:id/remind", authenticate, (req, res) => {
  const b = db.itemBorrows.find(b => b.id === parseInt(req.params.id));
  if (b) db.notifications.push({ id: nextId(db.notifications), userId: b.lentBy, type: "reminder", title: "物品催还提醒", content: "请及时归还借出的物品", isRead: false, relatedId: b.id, relatedType: "borrow", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  persist(); res.json({ code: 0, message: "催还通知已发送" });
});
app.get("/api/inventory/unused", authenticate, (req, res) => {
  const { months = 12 } = req.query;
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - parseInt(months));
  const familySpaces = db.spaces.filter(s => s.familyId === parseInt(req.query.familyId)).map(s => s.id);
  const items = db.items.filter(i => familySpaces.includes(i.spaceId) && i.status === "active" && (!i.lastUsedDate || new Date(i.lastUsedDate) < cutoff)).map(i => ({ ...i, Space: db.spaces.find(s => s.id === i.spaceId) }));
  res.json({ code: 0, data: items });
});
app.get("/api/inventory/reminders", authenticate, (req, res) => {
  const familySpaces = db.spaces.filter(s => s.familyId === parseInt(req.query.familyId)).map(s => s.id);
  const today = new Date().toISOString().slice(0,10);
  const in7 = new Date(Date.now() + 7*86400000).toISOString().slice(0,10);
  const items = db.items.filter(i => familySpaces.includes(i.spaceId) && i.status === "active" && i.expiryDate && i.expiryDate >= today && i.expiryDate <= in7).map(i => ({ ...i, Space: db.spaces.find(s => s.id === i.spaceId) }));
  res.json({ code: 0, data: items });
});
// ===== Dashboard =====
app.get("/api/dashboard", authenticate, (req, res) => {
  const fId = parseInt(req.query.familyId);
  const bIds = db.accountBooks.filter(b => b.familyId === fId || (b.userId === req.userId && b.type === "personal")).map(b => b.id);
  const ym = new Date().toISOString().slice(0,7);
  const td = new Date().toISOString().slice(0,10);
  const monthlyIncome = sumArr(db.transactions, { bookId: { $in: bIds }, type: "income", status: "normal", transactionDate: { $startsWith: ym } }, "amount");
  const monthlyExpense = sumArr(db.transactions, { bookId: { $in: bIds }, type: "expense", status: "normal", transactionDate: { $startsWith: ym } }, "amount");
  const budgets = db.budgets.filter(b => bIds.includes(b.bookId) && b.month === ym);
  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.length > 0 ? sumArr(db.transactions, { bookId: { $in: bIds }, type: "expense", status: "normal", transactionDate: { $startsWith: ym } }, "amount") : 0;
  const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const albums = db.albums.filter(a => a.familyId === fId && a.status === "active").map(a => a.id);
  const totalPhotos = db.photos.filter(p => albums.includes(p.albumId) && !p.isDeleted).length;
  const recentPhotos = db.photos.filter(p => albums.includes(p.albumId) && !p.isDeleted).sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0,9);
  const spaceIds = db.spaces.filter(s => s.familyId === fId).map(s => s.id);
  const totalItems = db.items.filter(i => spaceIds.includes(i.spaceId) && i.status === "active").length;
  const expiringItems = db.items.filter(i => spaceIds.includes(i.spaceId) && i.status === "active" && i.expiryDate && i.expiryDate >= td && i.expiryDate <= new Date(Date.now() + 7*86400000).toISOString().slice(0,10)).length;
  const notifications = db.notifications.filter(n => n.userId === req.userId && !n.isRead).sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0,5);
  const categories = db.categories.filter(c => c.type === "expense" && c.builtIn).slice(0,6);
  res.json({ code: 0, data: {
    accounting: { monthlyIncome: monthlyIncome.toFixed(2), monthlyExpense: monthlyExpense.toFixed(2), todayExpense: sumArr(db.transactions, { bookId: { $in: bIds }, type: "expense", status: "normal", transactionDate: td }, "amount").toFixed(2), budgetPercent },
    album: { totalPhotos, recentPhotos },
    inventory: { totalItems, expiringItems },
    notifications, recentCategories: categories
  }});
});
// ===== Wishlist Routes =====
app.post("/api/wishlist", authenticate, (req, res) => {
  const item = { id: nextId(db.wishlists || (db.wishlists = [])), ...req.body, createdBy: req.userId, status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.wishlists.push(item); persist();
  res.status(201).json({ code: 0, data: item, message: "许愿成功" });
});
app.get("/api/wishlist", authenticate, (req, res) => {
  const { familyId, status } = req.query;
  let items = (db.wishlists || []).filter(w => w.familyId === parseInt(familyId) && w.status !== "deleted");
  if (status) items = items.filter(w => w.status === status);
  items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
  res.json({ code: 0, data: items });
});
app.put("/api/wishlist/:id", authenticate, (req, res) => {
  const item = (db.wishlists || []).find(w => w.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ code: 404, message: "心愿不存在" });
  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  if (req.body.status === "fulfilled" && !item.fulfilledAt) item.fulfilledAt = new Date().toISOString().slice(0, 10);
  persist(); res.json({ code: 0, data: item, message: "更新成功" });
});
app.delete("/api/wishlist/:id", authenticate, (req, res) => {
  const item = (db.wishlists || []).find(w => w.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ code: 404, message: "心愿不存在" });
  item.status = "deleted"; persist();
  res.json({ code: 0, message: "已删除" });
});
// ===== Diary Routes =====
app.post("/api/diary", authenticate, (req, res) => {
  const item = { id: nextId(db.diaries || (db.diaries = [])), ...req.body, createdBy: req.userId, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.diaries.push(item); persist();
  const creator = db.users.find(u => u.id === req.userId);
  res.status(201).json({ code: 0, data: { ...item, creator: creator ? { id: creator.id, nickname: creator.nickname, avatar: creator.avatar } : null }, message: "发表成功" });
});
app.get("/api/diary", authenticate, (req, res) => {
  const { familyId, page = 1, pageSize = 20, keyword } = req.query;
  let items = (db.diaries || []).filter(d => d.familyId === parseInt(familyId) && d.status !== "deleted");
  if (keyword) {
    const q = keyword.toLowerCase();
    items = items.filter(d => (d.title || "").toLowerCase().includes(q) || (d.content || "").toLowerCase().includes(q));
  }
  items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const total = items.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  const list = items.slice(start, start + parseInt(pageSize)).map(d => ({
    ...d, creator: (() => { const u = db.users.find(u => u.id === d.createdBy); return u ? { id: u.id, nickname: u.nickname, avatar: u.avatar } : null; })()
  }));
  res.json({ code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});
app.get("/api/diary/:id", authenticate, (req, res) => {
  const item = (db.diaries || []).find(d => d.id === parseInt(req.params.id) && d.status !== "deleted");
  if (!item) return res.status(404).json({ code: 404, message: "日记不存在" });
  const creator = db.users.find(u => u.id === item.createdBy);
  res.json({ code: 0, data: { ...item, creator: creator ? { id: creator.id, nickname: creator.nickname, avatar: creator.avatar } : null } });
});
app.put("/api/diary/:id", authenticate, (req, res) => {
  const item = (db.diaries || []).find(d => d.id === parseInt(req.params.id) && d.status !== "deleted");
  if (!item) return res.status(404).json({ code: 404, message: "日记不存在" });
  if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: "只能编辑自己的日记" });
  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  persist();
  const creator = db.users.find(u => u.id === item.createdBy);
  res.json({ code: 0, data: { ...item, creator: creator ? { id: creator.id, nickname: creator.nickname, avatar: creator.avatar } : null }, message: "更新成功" });
});
app.delete("/api/diary/:id", authenticate, (req, res) => {
  const item = (db.diaries || []).find(d => d.id === parseInt(req.params.id) && d.status !== "deleted");
  if (!item) return res.status(404).json({ code: 404, message: "日记不存在" });
  if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: "只能删除自己的日记" });
  item.status = "deleted"; persist();
  res.json({ code: 0, message: "已删除" });
});
// ===== AI Routes =====
app.get("/api/admin/settings", authenticate, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ code: 403, message: "需要管理员权限" });
  const settings = {};
  (db.systemSettings || []).forEach(s => { settings[s.key] = s.value; });
  // 掩码处理 API Key
  if (settings.ai_api_key && settings.ai_api_key.length > 8) {
    settings.ai_api_key = "sk-..." + settings.ai_api_key.slice(-4);
  }
  res.json({ code: 0, data: settings });
});
app.put("/api/admin/settings", authenticate, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ code: 403, message: "需要管理员权限" });
  if (!db.systemSettings) db.systemSettings = [];
  for (const [key, value] of Object.entries(req.body)) {
    const existing = db.systemSettings.find(s => s.key === key);
    if (existing) existing.value = value;
    else db.systemSettings.push({ key, value });
  }
  persist(); res.json({ code: 0, message: "设置已保存" });
});
// AI 工具定义
const AI_TOOLS = [{
  type: "function",
  function: {
    name: "create_transaction",
    description: "创建一笔记账交易记录。当用户提到消费、收入、花钱、进账等记账相关内容时使用此工具。",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["expense", "income"], description: "交易类型" },
        amount: { type: "number", description: "交易金额" },
        categoryName: { type: "string", description: "分类名称" },
        note: { type: "string", description: "交易备注" },
        transactionDate: { type: "string", description: "交易日期 YYYY-MM-DD" }
      },
      required: ["type", "amount", "categoryName", "note", "transactionDate"]
    }
  }
}, {
  type: "function",
  function: {
    name: "create_todo",
    description: "创建一条待办事项。当用户提到待办、提醒、任务、要做的事、记住、别忘了等时使用此工具。",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "待办标题" },
        description: { type: "string", description: "详细描述" },
        dueDate: { type: "string", description: "截止日期 YYYY-MM-DD" },
        dueTime: { type: "string", description: "截止时间 HH:mm" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "优先级" }
      },
      required: ["title", "priority"]
    }
  }
}];

function matchCategory(name, type) {
  const cats = (db.categories || []).filter(c => c.type === type);
  let cat = cats.find(c => c.name === name);
  if (cat) return cat;
  cat = cats.find(c => c.name.includes(name) || name.includes(c.name));
  if (cat) return cat;
  return cats.find(c => !c.parentId) || cats[0];
}

function executeAITool(toolName, args, userId, familyId) {
  if (toolName === "create_transaction") {
    const books = (db.accountBooks || []).filter(b => b.familyId === parseInt(familyId) && b.status === "active");
    if (!books.length) return { success: false, message: "没有可用的账本" };
    const bookId = books[0].id;
    const type = args.type || "expense";
    const category = matchCategory(args.categoryName || "", type);
    if (!category) return { success: false, message: "找不到分类" + args.categoryName };
    const txn = { id: nextId(db.transactions), bookId, type, amount: parseFloat(args.amount), categoryId: category.id, note: args.note || "", transactionDate: args.transactionDate || new Date().toISOString().slice(0,10), createdBy: userId, status: "normal", source: "manual", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.transactions.push(txn); persist();
    return { success: true, message: "记账成功", transaction: { id: txn.id, type, amount: txn.amount, categoryName: category.name, note: txn.note, date: txn.transactionDate } };
  }
  if (toolName === "create_todo") {
    const todo = { id: nextId(db.todos), familyId: parseInt(familyId), title: args.title, description: args.description || "", dueDate: args.dueDate || null, dueTime: args.dueTime || null, priority: args.priority || "medium", reminderBefore: 0, completed: false, archived: false, createdBy: userId, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.todos.push(todo); persist();
    return { success: true, message: "待办创建成功", todo: { id: todo.id, title: todo.title, dueDate: todo.dueDate, dueTime: todo.dueTime, priority: todo.priority } };
  }
  return { success: false, message: "未知工具" };
}

app.post("/api/ai/chat", authenticate, async (req, res) => {
  const { messages, familyId } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ code: 400, message: "请输入消息" });
  const settings = {};
  (db.systemSettings || []).forEach(s => { settings[s.key] = s.value; });
  const apiKey = settings.ai_api_key;
  if (!apiKey) return res.status(400).json({ code: 400, message: "AI 功能未配置，请联系管理员设置 API Key" });
  const baseUrl = settings.ai_base_url || "https://api.deepseek.com";
  const model = settings.ai_model || "deepseek-chat";
  const catNames = (db.categories || []).filter(c => !c.parentId && c.builtIn).map(c => c.name).join("、");
  const books = (db.accountBooks || []).filter(b => b.familyId === parseInt(familyId) && b.status === "active");
  const systemPrompt = (settings.ai_system_prompt || "你是一个家庭管家AI助手。") + "\n你有工具可以记账。当用户提到消费、收入、花钱时，使用create_transaction工具。\n当前分类：" + (catNames || "暂无") + "\n当前账本：" + books.map(b => b.name).join("、") + "\n今天：" + new Date().toISOString().slice(0,10);
  try {
    const response = await fetch(baseUrl + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], tools: AI_TOOLS, tool_choice: "auto", max_tokens: 2000, temperature: 0.7 })
    });
    if (!response.ok) { const err = await response.text(); console.error("[AI] API error:", response.status, err); return res.status(500).json({ code: 500, message: "AI 服务请求失败" }); }
    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    if (message?.tool_calls?.length) {
      const toolCall = message.tool_calls[0];
      let toolArgs; try { toolArgs = JSON.parse(toolCall.function.arguments); } catch { toolArgs = {}; }
      const toolResult = executeAITool(toolCall.function.name, toolArgs, req.userId, familyId);
      const followUp = await fetch(baseUrl + "/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ model, messages: [...[{ role: "system", content: systemPrompt }], ...messages, message, { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) }], max_tokens: 1000, temperature: 0.7 })
      });
      let reply = "";
      if (followUp.ok) { const d = await followUp.json(); reply = d.choices?.[0]?.message?.content || ""; }
      res.json({ code: 0, data: { reply: reply || (toolResult.success ? "记账成功！" : toolResult.message), toolCall: { name: toolCall.function.name, result: toolResult }, usage: data.usage } });
    } else {
      res.json({ code: 0, data: { reply: message?.content || "抱歉，我没有理解。", usage: data.usage } });
    }
  } catch (err) { console.error("[AI] Error:", err.message); res.status(500).json({ code: 500, message: "AI 服务异常" }); }
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
const frontendDist = path.join(__dirname, "../frontend/dist");
try { require("fs").accessSync(frontendDist); } catch(e) { frontendDist = null; }
if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => { if (!req.path.startsWith("/api")) res.sendFile(path.join(frontendDist, "index.html")); });
  console.log("Frontend static:", frontendDist);
}
app.listen(PORT, "0.0.0.0", () => {
  console.log("============================================");
  console.log("  家庭管家 Backend Server");
  console.log("  API:  http://localhost:" + PORT + "/api");
  console.log("  Web:  http://localhost:" + PORT);
  console.log("  Login: admin / 123456");
  console.log("============================================");
});

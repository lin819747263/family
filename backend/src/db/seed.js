const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function load(name) {
  const fp = path.join(DB_DIR, `${name}.json`);
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return []; }
}

function save(name, data) {
  ensureDir();
  fs.writeFileSync(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

function loadDb() {
  return {
    users: load('users'),
    families: load('families'),
    familyMembers: load('familyMembers'),
    accountBooks: load('accountBooks'),
    transactions: load('transactions'),
    categories: load('categories'),
    budgets: load('budgets'),
    recurringBills: load('recurringBills'),
    albums: load('albums'),
    photos: load('photos'),
    albumShares: load('albumShares'),
    photoComments: load('photoComments'),
    photoLikes: load('photoLikes'),
    storageSpaces: load('storageSpaces'),
    spaces: load('spaces'),
    items: load('items'),
    itemBorrows: load('itemBorrows'),
    notifications: load('notifications'),
    backupLogs: load('backupLogs')
  };
}

function saveDb(db) {
  ensureDir();
  for (const [key, value] of Object.entries(db)) {
    save(key, value);
  }
}

function nextId(arr) {
  if (arr.length === 0) return 1;
  return Math.max(...arr.map(i => i.id || 0)) + 1;
}

function seedDb() {
  const db = loadDb();
  let changed = false;

  if (db.users.length === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    db.users.push(
      { id: 1, username: 'admin', password: hash, nickname: '家庭管理员', email: 'admin@home.com', role: 'admin', theme: 'light', fontSize: 'normal', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, username: 'member', password: hash, nickname: '家庭成员', email: 'member@home.com', role: 'member', theme: 'light', fontSize: 'normal', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    );
    changed = true;
  }

  if (db.families.length === 0) {
    db.families.push({ id: 1, name: '幸福之家', description: '我们的家庭', inviteCode: 'HOME2024', createdBy: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    db.familyMembers.push(
      { id: 1, familyId: 1, userId: 1, role: 'owner', nickname: '爸爸', joinedAt: new Date().toISOString() },
      { id: 2, familyId: 1, userId: 2, role: 'member', nickname: '妈妈', joinedAt: new Date().toISOString() }
    );
    changed = true;
  }

  if (db.categories.length === 0) {
    const cats = [
      { id: 1, name: '餐饮', icon: 'utensils', type: 'expense' },
      { id: 2, name: '交通', icon: 'car', type: 'expense' },
      { id: 3, name: '教育', icon: 'book', type: 'expense' },
      { id: 4, name: '医疗', icon: 'heart-pulse', type: 'expense' },
      { id: 5, name: '住房', icon: 'home', type: 'expense' },
      { id: 6, name: '人情', icon: 'users', type: 'expense' },
      { id: 7, name: '购物', icon: 'shopping-bag', type: 'expense' },
      { id: 8, name: '娱乐', icon: 'gamepad-2', type: 'expense' },
      { id: 9, name: '工资', icon: 'wallet', type: 'income' },
      { id: 10, name: '其他', icon: 'ellipsis', type: 'expense' }
    ].map(c => ({ ...c, parentId: null, sort: c.id, builtIn: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    db.categories.push(...cats);
    changed = true;
  }

  if (db.accountBooks.length === 0) {
    db.accountBooks.push({ id: 1, name: '家庭账本', type: 'family', description: '日常家庭开支', icon: 'book', familyId: 1, userId: 1, isDefault: true, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    changed = true;
  }

  if (db.spaces.length === 0) {
    const newSpaces = [
      { id: 1, name: '幸福之家', icon: 'Home', level: 'home', parentId: null, familyId: 1, sort: 1 },
      { id: 2, name: '客厅', icon: 'Tv', level: 'room', parentId: 1, familyId: 1, sort: 1 },
      { id: 3, name: '主卧', icon: 'Bed', level: 'room', parentId: 1, familyId: 1, sort: 2 },
      { id: 4, name: '衣柜', icon: 'FolderOpened', level: 'cabinet', parentId: 3, familyId: 1, sort: 1 },
      { id: 5, name: '床头柜', icon: 'FolderOpened', level: 'drawer', parentId: 4, familyId: 1, sort: 1 }
    ].map(c => ({ ...c, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    db.spaces.push(...newSpaces);
    changed = true;
  }

  if (db.items.length === 0) {
    db.items.push(
      { id: 1, name: '感冒药', description: '三九感冒灵', quantity: 2, price: 25.00, purchaseDate: '2025-06-01', expiryDate: '2026-12-01', category: '药品', tags: '药品,常备', spaceId: 5, photos: null, createdBy: 1, status: 'active', lastUsedDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, name: '充电器', description: 'Type-C 65W快充', quantity: 1, price: 129.00, purchaseDate: '2025-01-15', warrantyMonths: 12, expiryDate: null, category: '电子产品', tags: '电子产品,充电器', spaceId: 4, photos: null, createdBy: 1, status: 'active', lastUsedDate: '2026-06-20', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    );
    changed = true;
  }

  if (db.transactions.length === 0) {
    const today = new Date();
    for (let d = 0; d < 30; d++) {
      const date = new Date(today); date.setDate(date.getDate() - d);
      db.transactions.push({
        id: nextId(db.transactions), bookId: 1, type: 'expense',
        amount: Math.round(Math.random() * 200 + 20),
        categoryId: [1, 2, 7, 8][Math.floor(Math.random() * 4)],
        tags: '', note: d === 0 ? '今日消费' : '日常开支',
        transactionDate: date.toISOString().slice(0, 10),
        createdBy: 1, source: 'manual', status: 'normal',
        createdAt: date.toISOString(), updatedAt: date.toISOString()
      });
    }
    db.transactions.push({
      id: nextId(db.transactions), bookId: 1, type: 'income', amount: 15000,
      categoryId: 9, tags: '', note: '工资收入',
      transactionDate: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-10`,
      createdBy: 1, source: 'manual', status: 'normal',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    changed = true;
  }

  if (db.albums.length === 0) {
    db.albums.push(
      { id: 1, name: '2024春节', description: '春节团圆', type: 'normal', password: null, coverUrl: null, familyId: 1, createdBy: 1, sort: 1, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, name: '旅行记录', description: '亲子游', type: 'encrypted', password: null, coverUrl: null, familyId: 1, createdBy: 1, sort: 2, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    );
    changed = true;
  }

  if (db.storageSpaces.length === 0) {
    db.storageSpaces.push({ id: 1, familyId: 1, userId: 1, usedBytes: 0, totalBytes: 1073741824, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  if (db.notifications.length === 0) {
    db.notifications.push({ id: 1, userId: 1, type: 'reminder', title: '充电器保修到期提醒', content: '"充电器"保修期即将到期', isRead: false, relatedId: 2, relatedType: 'item', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    changed = true;
  }

  if (changed) saveDb(db);
  return loadDb();
}

module.exports = { loadDb, saveDb, nextId, seedDb };

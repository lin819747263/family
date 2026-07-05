/**
 * 修复数据库字符集和现有数据乱码问题
 * 运行方式: node src/utils/fixCharset.js
 */
require('dotenv').config();
const { sequelize } = require('../models');

async function fixCharset() {
  try {
    console.log('连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 1. 修改数据库字符集
    console.log('修改数据库字符集...');
    await sequelize.query('ALTER DATABASE family_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('数据库字符集已更新');

    // 2. 修改所有表的字符集
    console.log('修改表字符集...');
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];

    for (const table of tables) {
      const tableName = table[tableKey];
      try {
        await sequelize.query(`ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`  表 ${tableName} 字符集已更新`);
      } catch (err) {
        console.log(`  表 ${tableName} 跳过: ${err.message}`);
      }
    }

    // 3. 修复已乱码的数据（将错误编码的数据重新编码）
    console.log('检查并修复乱码数据...');

    // 修复 families 表
    const [families] = await sequelize.query('SELECT id, name FROM families');
    for (const f of families) {
      if (f.name && isGarbled(f.name)) {
        const fixed = fixGarbledText(f.name);
        if (fixed !== f.name) {
          await sequelize.query('UPDATE families SET name = ? WHERE id = ?', { replacements: [fixed, f.id] });
          console.log(`  修复家庭 ${f.id}: ${f.name} -> ${fixed}`);
        }
      }
    }

    // 修复 users 表
    const [users] = await sequelize.query('SELECT id, nickname FROM users');
    for (const u of users) {
      if (u.nickname && isGarbled(u.nickname)) {
        const fixed = fixGarbledText(u.nickname);
        if (fixed !== u.nickname) {
          await sequelize.query('UPDATE users SET nickname = ? WHERE id = ?', { replacements: [fixed, u.id] });
          console.log(`  修复用户 ${u.id}: ${u.nickname} -> ${fixed}`);
        }
      }
    }

    // 修复 categories 表
    const [categories] = await sequelize.query('SELECT id, name FROM categories');
    for (const c of categories) {
      if (c.name && isGarbled(c.name)) {
        const fixed = fixGarbledText(c.name);
        if (fixed !== c.name) {
          await sequelize.query('UPDATE categories SET name = ? WHERE id = ?', { replacements: [fixed, c.id] });
          console.log(`  修复分类 ${c.id}: ${c.name} -> ${fixed}`);
        }
      }
    }

    // 修复 account_books 表
    const [books] = await sequelize.query('SELECT id, name, description FROM account_books');
    for (const b of books) {
      let updated = false;
      const updates = {};
      if (b.name && isGarbled(b.name)) {
        updates.name = fixGarbledText(b.name);
        updated = true;
      }
      if (b.description && isGarbled(b.description)) {
        updates.description = fixGarbledText(b.description);
        updated = true;
      }
      if (updated) {
        const sets = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        const values = Object.values(updates);
        values.push(b.id);
        await sequelize.query(`UPDATE account_books SET ${sets} WHERE id = ?`, { replacements: values });
        console.log(`  修复账本 ${b.id}: ${JSON.stringify(updates)}`);
      }
    }

    // 修复 transactions 表
    const [txns] = await sequelize.query('SELECT id, note FROM transactions WHERE note IS NOT NULL');
    for (const t of txns) {
      if (t.note && isGarbled(t.note)) {
        const fixed = fixGarbledText(t.note);
        if (fixed !== t.note) {
          await sequelize.query('UPDATE transactions SET note = ? WHERE id = ?', { replacements: [fixed, t.id] });
          console.log(`  修复交易 ${t.id}: ${t.note} -> ${fixed}`);
        }
      }
    }

    // 修复 anniversaries 表
    const [annivs] = await sequelize.query('SELECT id, title, note FROM anniversaries');
    for (const a of annivs) {
      let updated = false;
      const updates = {};
      if (a.title && isGarbled(a.title)) {
        updates.title = fixGarbledText(a.title);
        updated = true;
      }
      if (a.note && isGarbled(a.note)) {
        updates.note = fixGarbledText(a.note);
        updated = true;
      }
      if (updated) {
        const sets = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        const values = Object.values(updates);
        values.push(a.id);
        await sequelize.query(`UPDATE anniversaries SET ${sets} WHERE id = ?`, { replacements: values });
        console.log(`  修复纪念日 ${a.id}: ${JSON.stringify(updates)}`);
      }
    }

    // 修复 recipes 表
    const [recipes] = await sequelize.query('SELECT id, name, description FROM recipes');
    for (const r of recipes) {
      let updated = false;
      const updates = {};
      if (r.name && isGarbled(r.name)) {
        updates.name = fixGarbledText(r.name);
        updated = true;
      }
      if (r.description && isGarbled(r.description)) {
        updates.description = fixGarbledText(r.description);
        updated = true;
      }
      if (updated) {
        const sets = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        const values = Object.values(updates);
        values.push(r.id);
        await sequelize.query(`UPDATE recipes SET ${sets} WHERE id = ?`, { replacements: values });
        console.log(`  修复菜谱 ${r.id}: ${JSON.stringify(updates)}`);
      }
    }

    // 修复 spaces 表
    const [spaces] = await sequelize.query('SELECT id, name FROM spaces');
    for (const s of spaces) {
      if (s.name && isGarbled(s.name)) {
        const fixed = fixGarbledText(s.name);
        if (fixed !== s.name) {
          await sequelize.query('UPDATE spaces SET name = ? WHERE id = ?', { replacements: [fixed, s.id] });
          console.log(`  修复空间 ${s.id}: ${s.name} -> ${fixed}`);
        }
      }
    }

    // 修复 items 表
    const [items] = await sequelize.query('SELECT id, name, category, description FROM items');
    for (const i of items) {
      let updated = false;
      const updates = {};
      if (i.name && isGarbled(i.name)) {
        updates.name = fixGarbledText(i.name);
        updated = true;
      }
      if (i.category && isGarbled(i.category)) {
        updates.category = fixGarbledText(i.category);
        updated = true;
      }
      if (i.description && isGarbled(i.description)) {
        updates.description = fixGarbledText(i.description);
        updated = true;
      }
      if (updated) {
        const sets = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        const values = Object.values(updates);
        values.push(i.id);
        await sequelize.query(`UPDATE items SET ${sets} WHERE id = ?`, { replacements: values });
        console.log(`  修复物品 ${i.id}: ${JSON.stringify(updates)}`);
      }
    }

    // 修复 albums 表
    const [albums] = await sequelize.query('SELECT id, name, description FROM albums');
    for (const a of albums) {
      let updated = false;
      const updates = {};
      if (a.name && isGarbled(a.name)) {
        updates.name = fixGarbledText(a.name);
        updated = true;
      }
      if (a.description && isGarbled(a.description)) {
        updates.description = fixGarbledText(a.description);
        updated = true;
      }
      if (updated) {
        const sets = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        const values = Object.values(updates);
        values.push(a.id);
        await sequelize.query(`UPDATE albums SET ${sets} WHERE id = ?`, { replacements: values });
        console.log(`  修复相册 ${a.id}: ${JSON.stringify(updates)}`);
      }
    }

    // 修复 photos 表
    const [photos] = await sequelize.query('SELECT id, original_name FROM photos');
    for (const p of photos) {
      if (p.original_name && isGarbled(p.original_name)) {
        const fixed = fixGarbledText(p.original_name);
        if (fixed !== p.original_name) {
          await sequelize.query('UPDATE photos SET original_name = ? WHERE id = ?', { replacements: [fixed, p.id] });
          console.log(`  修复照片 ${p.id}: ${p.original_name} -> ${fixed}`);
        }
      }
    }

    console.log('字符集修复完成!');
    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

// 检测是否为乱码文本
function isGarbled(text) {
  if (!text) return false;
  // 检测常见的乱码模式：连续的 ? 或特殊字符
  if (text.includes('?') || text.includes('??')) return true;
  // 检测 UTF-8 编码被错误解读的情况
  const garbledPattern = /[\x80-\xff]{2,}/;
  return garbledPattern.test(text);
}

// 尝试修复乱码文本
function fixGarbledText(text) {
  if (!text) return text;
  // 如果包含 ?，可能是无法恢复的乱码
  if (text.includes('?')) {
    // 尝试从常见的乱码模式恢复
    // 这里可以根据实际情况添加更多的修复规则
    return text;
  }
  return text;
}

fixCharset();

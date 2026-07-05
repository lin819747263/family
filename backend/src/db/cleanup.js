/**
 * 数据清理脚本
 * 保留：admin 账号 + 预设分类数据
 * 清除：所有业务数据（交易、相册、物品等）
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize, User, Family, FamilyMember, AccountBook, Transaction, Budget, Category, RecurringBill, Album, Photo, AlbumShare, PhotoComment, StorageSpace, Space, Item, ItemBorrow, Notification, Anniversary, Recipe } = require('../models');

async function cleanup() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功\n');

    // 1. 找到 admin 用户
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('未找到管理员账号，终止操作');
      process.exit(1);
    }
    console.log(`管理员账号: ${admin.username} (ID: ${admin.id})`);

    // 2. 找到 admin 所属的家庭
    const adminMember = await FamilyMember.findOne({ where: { userId: admin.id } });
    const adminFamilyId = adminMember ? adminMember.familyId : null;
    console.log(`管理员家庭 ID: ${adminFamilyId || '无'}\n`);

    // 开始清理（禁用外键检查）
    console.log('=== 开始清理业务数据 ===');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'photo_comments', 'photo_likes', 'photos', 'album_shares', 'albums', 'storage_spaces',
      'item_borrows', 'items', 'spaces', 'transactions', 'budgets', 'recurring_bills',
      'account_books', 'notifications', 'anniversaries', 'recipes'
    ];
    for (const table of tables) {
      const [result] = await sequelize.query(`DELETE FROM ${table}`);
      console.log(`✓ ${table}: 已清除`);
    }

    // 账本
    const delBooks = await AccountBook.destroy({ where: {}, truncate: true, cascade: true });
    console.log(`✓ 账本: 清除 ${delBooks} 个`);

    // 通知
    const delNotifs = await Notification.destroy({ where: {}, truncate: true, cascade: true });
    console.log(`✓ 通知: 清除 ${delNotifs} 条`);

    // 纪念日
    const delAnniv = await Anniversary.destroy({ where: {}, truncate: true, cascade: true });
    console.log(`✓ 纪念日: 清除 ${delAnniv} 条`);

    // 菜谱
    const delRecipes = await Recipe.destroy({ where: {}, truncate: true, cascade: true });
    console.log(`✓ 菜谱: 清除 ${delRecipes} 个`);

    // 分类（保留预设，清除自定义）
    await sequelize.query('DELETE FROM categories WHERE family_id IS NOT NULL');
    console.log('✓ 自定义分类: 已清除');

    // 删除非 admin 用户的家庭成员
    await sequelize.query(`DELETE FROM family_members WHERE user_id != ${admin.id}`);
    // 删除非 admin 用户
    await sequelize.query(`DELETE FROM users WHERE id != ${admin.id}`);
    console.log('✓ 非管理员用户: 已清除');

    // 删除无成员的家庭
    await sequelize.query('DELETE FROM families WHERE id NOT IN (SELECT DISTINCT family_id FROM family_members)');
    console.log('✓ 空家庭: 已删除');

    // 重新启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 重建 admin 的默认数据
    console.log('\n=== 重建管理员默认数据 ===');

    if (adminFamilyId) {
      const family = await Family.findByPk(adminFamilyId);
      if (family) {
        // 检查是否已有账本
        const bookCount = await AccountBook.count({ where: { familyId: adminFamilyId } });
        if (bookCount === 0) {
          await AccountBook.create({
            name: family.name + '账本',
            type: 'family',
            description: '日常家庭开支',
            icon: 'book',
            familyId: adminFamilyId,
            userId: admin.id,
            isDefault: true,
            status: 'active'
          });
          console.log('✓ 默认账本已创建');
        }

        // 检查是否已有空间
        const spaceCount = await Space.count({ where: { familyId: adminFamilyId } });
        if (spaceCount === 0) {
          const home = await Space.create({ name: family.name, icon: 'Home', level: 'home', parentId: null, familyId: adminFamilyId, sort: 1 });
          await Space.create({ name: '客厅', icon: 'Tv', level: 'room', parentId: home.id, familyId: adminFamilyId, sort: 1 });
          await Space.create({ name: '主卧', icon: 'Bed', level: 'room', parentId: home.id, familyId: adminFamilyId, sort: 2 });
          console.log('✓ 默认空间已创建');
        }
      }
    }

    // 确保预设分类存在
    const presetCount = await Category.count({ where: { familyId: null } });
    if (presetCount === 0) {
      console.log('正在重建预设分类...');
      const presets = [
        { name: '餐饮', icon: 'utensils', type: 'expense', sort: 1 },
        { name: '交通', icon: 'car', type: 'expense', sort: 2 },
        { name: '教育', icon: 'book', type: 'expense', sort: 3 },
        { name: '医疗', icon: 'heart-pulse', type: 'expense', sort: 4 },
        { name: '住房', icon: 'home', type: 'expense', sort: 5 },
        { name: '人情', icon: 'users', type: 'expense', sort: 6 },
        { name: '购物', icon: 'shopping-bag', type: 'expense', sort: 7 },
        { name: '娱乐', icon: 'gamepad-2', type: 'expense', sort: 8 },
        { name: '工资', icon: 'wallet', type: 'income', sort: 9 },
        { name: '其他收入', icon: 'ellipsis', type: 'income', sort: 10 }
      ];
      for (const cat of presets) {
        await Category.create({ ...cat, builtIn: true, familyId: null, parentId: null });
      }
      console.log('✓ 预设分类已重建');
    } else {
      console.log(`✓ 预设分类已存在 (${presetCount} 条)`);
    }

    console.log('\n=== 清理完成 ===');
    console.log(`保留的管理员: ${admin.username}`);
    process.exit(0);
  } catch (err) {
    console.error('清理失败:', err);
    process.exit(1);
  }
}

cleanup();

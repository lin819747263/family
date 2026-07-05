const bcrypt = require('bcryptjs');
const { User, Family, FamilyMember, SystemSetting, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取用户列表
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { nickname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

// 获取单个用户详情
exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: FamilyMember,
        include: [{ model: Family, attributes: ['id', 'name'] }]
      }]
    });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    res.json({ code: 0, data: user });
  } catch (err) { next(err); }
};

// 重置用户密码
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度不能少于6位' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ code: 0, message: `用户 ${user.username} 的密码已重置` });
  } catch (err) { next(err); }
};

// 启用/禁用用户
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    if (user.id === req.userId) {
      return res.status(400).json({ code: 400, message: '不能修改自己的状态' });
    }
    await user.update({ status });
    res.json({ code: 0, message: `用户已${status === 'active' ? '启用' : '禁用'}` });
  } catch (err) { next(err); }
};

// 系统统计概览
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const disabledUsers = await User.count({ where: { status: 'disabled' } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const totalFamilies = await Family.count();
    const totalMembers = await FamilyMember.count();
    res.json({
      code: 0,
      data: { totalUsers, activeUsers, disabledUsers, adminUsers, totalFamilies, totalMembers }
    });
  } catch (err) { next(err); }
};

// 获取系统设置
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findAll();
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    // 掩码处理敏感字段，不返回完整密钥
    if (map.ai_api_key && map.ai_api_key.length > 8) {
      map.ai_api_key = 'sk-...' + map.ai_api_key.slice(-4);
    }
    res.json({ code: 0, data: map });
  } catch (err) { next(err); }
};

// 更新系统设置
exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.upsert({ key, value });
    }
    res.json({ code: 0, message: '设置已保存' });
  } catch (err) { next(err); }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Family, FamilyMember, AccountBook, Space } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * 创建家庭及其默认数据（账本、空间）
 * @param {number} userId - 创建者用户ID
 * @param {string} familyName - 家庭名称
 * @returns {Promise<Family>} 创建的家庭对象
 */
async function createFamilyWithDefaults(userId, familyName) {
  const family = await Family.create({ name: familyName, inviteCode: uuidv4().slice(0, 8), createdBy: userId });
  await FamilyMember.create({ familyId: family.id, userId, role: 'owner' });
  await AccountBook.create({ name: familyName + '账本', type: 'family', description: '日常家庭开支', icon: 'book', familyId: family.id, userId, isDefault: true, status: 'active' });
  const home = await Space.create({ name: familyName, icon: 'Home', level: 'home', parentId: null, familyId: family.id, sort: 1 });
  await Space.create({ name: '客厅', icon: 'Tv', level: 'room', parentId: home.id, familyId: family.id, sort: 1 });
  await Space.create({ name: '主卧', icon: 'Bed', level: 'room', parentId: home.id, familyId: family.id, sort: 2 });
  return family;
}

exports.register = async (req, res, next) => {
  try {
    const { username, password, nickname, email, familyName } = req.body;
    // 输入验证
    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ code: 400, message: '用户名长度需在3-30个字符之间' });
    }
    if (!password || password.length < 6 || password.length > 50) {
      return res.status(400).json({ code: 400, message: '密码长度需在6-50个字符之间' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 400, message: '邮箱格式不正确' });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ code: 400, message: '用户名已存在' });
    const hashedPassword = await bcrypt.hash(password, 10);
    // 第一个注册的用户自动成为管理员
    const userCount = await User.count();
    const role = userCount === 0 ? 'admin' : 'member';
    const user = await User.create({ username, password: hashedPassword, nickname: nickname || username, email, role });
    if (familyName) {
      await createFamilyWithDefaults(user.id, familyName);
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ code: 0, data: { token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } }, message: '注册成功' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || user.status === 'disabled') return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ code: 0, data: { token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role, theme: user.theme, fontSize: user.fontSize } } });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
    const families = await user.getFamilies({ through: { attributes: ['role'] }, joinTableAttributes: [] });
    res.json({ code: 0, data: { user, families } });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { nickname, email, phone, theme, fontSize } = req.body;
    await User.update({ nickname, email, phone, theme, fontSize }, { where: { id: req.userId } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6 || newPassword.length > 50) {
      return res.status(400).json({ code: 400, message: '新密码长度需在6-50个字符之间' });
    }
    const user = await User.findByPk(req.userId);
    if (!await bcrypt.compare(oldPassword, user.password)) return res.status(400).json({ code: 400, message: '原密码错误' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ code: 0, message: '密码修改成功' });
  } catch (err) { next(err); }
};

exports.joinFamily = async (req, res, next) => {
  try {
    const family = await Family.findOne({ where: { inviteCode: req.body.inviteCode } });
    if (!family) return res.status(404).json({ code: 404, message: '邀请码无效' });
    const existing = await FamilyMember.findOne({ where: { familyId: family.id, userId: req.userId } });
    if (existing) return res.status(400).json({ code: 400, message: '已在该家庭中' });
    await FamilyMember.create({ familyId: family.id, userId: req.userId, role: 'member' });
    res.json({ code: 0, data: family, message: '加入成功' });
  } catch (err) { next(err); }
};

exports.createFamily = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ code: 400, message: '请输入家庭名称' });
    }
    const family = await createFamilyWithDefaults(req.userId, name.trim());
    res.status(201).json({ code: 0, data: family, message: '创建成功' });
  } catch (err) { next(err); }
};

// Token 黑名单（内存存储，重启后清空）
const tokenBlacklist = new Set();

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      tokenBlacklist.add(token);
      // 24小时后自动清理
      setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000);
    }
    res.json({ code: 0, message: '已退出登录' });
  } catch (err) { next(err); }
};

exports.isTokenBlacklisted = (token) => tokenBlacklist.has(token);

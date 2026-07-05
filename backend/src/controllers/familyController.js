const { Family, FamilyMember, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

// 获取家庭信息
exports.getFamilyInfo = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    if (!familyId) return res.status(400).json({ code: 400, message: '缺少 familyId 参数' });
    // 验证当前用户是该家庭成员
    const membership = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!membership) return res.status(403).json({ code: 403, message: '无权访问该家庭' });
    const family = await Family.findByPk(familyId);
    if (!family) return res.status(404).json({ code: 404, message: '家庭不存在' });
    res.json({ code: 0, data: family });
  } catch (err) { next(err); }
};

// 更新家庭信息
exports.updateFamilyInfo = async (req, res, next) => {
  try {
    const { familyId, name, description } = req.body;
    // 检查权限
    const member = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ code: 403, message: '无权限操作' });
    }
    await Family.update({ name, description }, { where: { id: familyId } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

// 获取成员列表
exports.getMembers = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    if (!familyId) return res.status(400).json({ code: 400, message: '缺少 familyId 参数' });
    // 验证当前用户是该家庭成员
    const membership = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!membership) return res.status(403).json({ code: 403, message: '无权访问该家庭' });
    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [{ model: User, attributes: ['id', 'username', 'nickname', 'avatar', 'phone'] }],
      order: [['role', 'ASC'], ['joined_at', 'ASC']]
    });
    res.json({ code: 0, data: members });
  } catch (err) { next(err); }
};

// 修改成员角色
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, familyId } = req.body;
    // 检查操作者权限
    const operator = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!operator || operator.role !== 'owner') {
      return res.status(403).json({ code: 403, message: '仅家庭创建者可修改角色' });
    }
    const member = await FamilyMember.findByPk(id);
    if (!member) return res.status(404).json({ code: 404, message: '成员不存在' });
    if (member.userId === req.userId) return res.status(400).json({ code: 400, message: '不能修改自己的角色' });
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ code: 400, message: '无效的角色值' });
    await member.update({ role });
    res.json({ code: 0, message: '角色更新成功' });
  } catch (err) { next(err); }
};

// 移除成员（硬删除 — 成员关系应彻底移除，不做软删除）
exports.removeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { familyId } = req.query;
    // 检查操作者权限
    const operator = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!operator || !['owner', 'admin'].includes(operator.role)) {
      return res.status(403).json({ code: 403, message: '无权限操作' });
    }
    const member = await FamilyMember.findByPk(id);
    if (!member) return res.status(404).json({ code: 404, message: '成员不存在' });
    if (member.userId === req.userId) return res.status(400).json({ code: 400, message: '不能移除自己' });
    if (member.role === 'owner') return res.status(400).json({ code: 400, message: '不能移除家庭创建者' });
    await member.destroy();
    res.json({ code: 0, message: '成员已移除' });
  } catch (err) { next(err); }
};

// 退出家庭
exports.leaveFamily = async (req, res, next) => {
  try {
    const { familyId } = req.body;
    const member = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!member) return res.status(400).json({ code: 400, message: '您不在此家庭中' });
    if (member.role === 'owner') return res.status(400).json({ code: 400, message: '家庭创建者不能退出，请先转让或解散家庭' });
    await member.destroy();
    res.json({ code: 0, message: '已退出家庭' });
  } catch (err) { next(err); }
};

// 重新生成邀请码
exports.regenerateInviteCode = async (req, res, next) => {
  try {
    const { familyId } = req.body;
    const operator = await FamilyMember.findOne({ where: { familyId, userId: req.userId } });
    if (!operator || !['owner', 'admin'].includes(operator.role)) {
      return res.status(403).json({ code: 403, message: '无权限操作' });
    }
    const newCode = uuidv4().slice(0, 8).toUpperCase();
    await Family.update({ inviteCode: newCode }, { where: { id: familyId } });
    res.json({ code: 0, data: { inviteCode: newCode }, message: '邀请码已更新' });
  } catch (err) { next(err); }
};

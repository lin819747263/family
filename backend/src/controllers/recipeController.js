const { Recipe, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// ===== 菜谱 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const { name, description, ingredients, steps, cookingTime, servings, difficulty, image } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入菜谱名称' });
    const item = await Recipe.create({
      name, description, image,
      ingredients: ingredients || [],
      steps: steps || [],
      cookingTime, servings,
      difficulty: difficulty || 'medium',
      familyId: req.body.familyId, createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: item, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId, keyword, difficulty, page = 1, pageSize = 20 } = req.query;
    const where = { familyId, status: 'active' };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (difficulty) where.difficulty = difficulty;

    const { count, rows } = await Recipe.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Recipe.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    });
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '菜谱不存在' });
    res.json({ code: 0, data: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Recipe.findByPk(id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '菜谱不存在' });
    // 检查权限：只能修改自己创建的菜谱
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能修改自己创建的菜谱' });
    const allowed = (({ name, description, ingredients, steps, cookingTime, servings, difficulty, image }) => ({ name, description, ingredients, steps, cookingTime, servings, difficulty, image }))(req.body);
    await item.update(allowed);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Recipe.findByPk(id);
    if (!item || item.status === 'deleted') return res.status(404).json({ code: 404, message: '菜谱不存在' });
    // 检查权限：只能删除自己创建的菜谱
    if (item.createdBy !== req.userId) return res.status(403).json({ code: 403, message: '只能删除自己创建的菜谱' });
    await item.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });
    res.json({ code: 0, data: { url: `/uploads/recipes/${req.file.filename}` } });
  } catch (err) { next(err); }
};

// 随机推荐菜谱
exports.random = async (req, res, next) => {
  try {
    const { familyId, count = 1 } = req.query;
    const where = { familyId, status: 'active' };
    const recipes = await Recipe.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname'] }],
      order: sequelize.random(),
      limit: Math.min(parseInt(count), 5)
    });
    res.json({ code: 0, data: recipes });
  } catch (err) { next(err); }
};

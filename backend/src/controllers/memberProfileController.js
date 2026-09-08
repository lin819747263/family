const { MemberProfile, WeightRecord, HeightRecord, User, FamilyMember } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ===== 成员档案 CRUD =====

exports.create = async (req, res, next) => {
  try {
    const { familyId, userId, name, gender, birthday, height, bloodType, phone,
      favoriteFoods, dislikedFoods, hobbies, allergies, notes, nickname, mbti, solarDate, lunarBirthday } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '请输入姓名' });

    const profile = await MemberProfile.create({
      familyId, userId: userId || null, name, gender, birthday, height, bloodType, phone,
      favoriteFoods: stringifyArray(favoriteFoods),
      dislikedFoods: stringifyArray(dislikedFoods),
      hobbies: stringifyArray(hobbies),
      allergies: stringifyArray(allergies),
      notes, nickname, mbti, solarDate, lunarBirthday,
      createdBy: req.userId
    });
    res.status(201).json({ code: 0, data: profile, message: '创建成功' });
  } catch (err) { next(err); }
};

exports.getList = async (req, res, next) => {
  try {
    const { familyId } = req.query;
    const profiles = await MemberProfile.findAll({
      where: { familyId, status: 'active' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] },
        { model: WeightRecord, attributes: ['weight', 'recordDate'], limit: 1, order: [['record_date', 'DESC']] },
        { model: HeightRecord, attributes: ['height', 'recordDate'], limit: 1, order: [['record_date', 'DESC']] }
      ],
      order: [['created_at', 'ASC']]
    });

    const list = profiles.map(p => {
      const json = p.toJSON();
      json.favoriteFoods = parseArray(json.favoriteFoods);
      json.dislikedFoods = parseArray(json.dislikedFoods);
      json.hobbies = parseArray(json.hobbies);
      json.allergies = parseArray(json.allergies);
      json.currentWeight = json.WeightRecords?.[0]?.weight || null;
      json.currentHeight = json.HeightRecords?.[0]?.height || json.height || null;
      json.WeightRecords = undefined;
      json.HeightRecords = undefined;
      return json;
    });

    res.json({ code: 0, data: list });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const profile = await MemberProfile.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] },
        { model: WeightRecord, order: [['record_date', 'DESC']], limit: 30 },
        { model: HeightRecord, order: [['record_date', 'DESC']], limit: 30 }
      ]
    });
    if (!profile || profile.status === 'deleted') return res.status(404).json({ code: 404, message: '成员不存在' });

    const json = profile.toJSON();
    json.favoriteFoods = parseArray(json.favoriteFoods);
    json.dislikedFoods = parseArray(json.dislikedFoods);
    json.hobbies = parseArray(json.hobbies);
    json.allergies = parseArray(json.allergies);

    res.json({ code: 0, data: json });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const profile = await MemberProfile.findByPk(req.params.id);
    if (!profile || profile.status === 'deleted') return res.status(404).json({ code: 404, message: '成员不存在' });

    const allowed = (({ userId, name, gender, birthday, height, bloodType, phone,
      favoriteFoods, dislikedFoods, hobbies, allergies, notes, nickname, mbti, solarDate, lunarBirthday }) =>
      ({ userId, name, gender, birthday, height, bloodType, phone,
        favoriteFoods: stringifyArray(favoriteFoods),
        dislikedFoods: stringifyArray(dislikedFoods),
        hobbies: stringifyArray(hobbies),
        allergies: stringifyArray(allergies),
        notes, nickname, mbti, solarDate, lunarBirthday }))(req.body);

    await profile.update(allowed);
    res.json({ code: 0, data: profile, message: '更新成功' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const profile = await MemberProfile.findByPk(req.params.id);
    if (!profile || profile.status === 'deleted') return res.status(404).json({ code: 404, message: '成员不存在' });
    await profile.update({ status: 'deleted' });
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// ===== 体测记录（体重+身高一起记录） =====

exports.addRecord = async (req, res, next) => {
  try {
    const { weight, height, recordDate, note } = req.body;
    if (!weight && !height) return res.status(400).json({ code: 400, message: '请输入体重或身高' });

    const profile = await MemberProfile.findByPk(req.params.id);
    if (!profile || profile.status === 'deleted') return res.status(404).json({ code: 404, message: '成员不存在' });

    const date = recordDate || dayjs().format('YYYY-MM-DD');
    const results = {};

    if (weight) {
      const wr = await WeightRecord.create({ profileId: profile.id, weight, recordDate: date, note, createdBy: req.userId });
      results.weight = wr;
    }
    if (height) {
      const hr = await HeightRecord.create({ profileId: profile.id, height, recordDate: date, note, createdBy: req.userId });
      results.height = hr;
    }

    res.status(201).json({ code: 0, data: results, message: '记录成功' });
  } catch (err) { next(err); }
};

exports.getRecordHistory = async (req, res, next) => {
  try {
    const { days = 180 } = req.query;
    const startDate = dayjs().subtract(parseInt(days), 'day').format('YYYY-MM-DD');

    const [weightRecords, heightRecords] = await Promise.all([
      WeightRecord.findAll({
        where: { profileId: req.params.id, recordDate: { [Op.gte]: startDate } },
        order: [['record_date', 'DESC']]
      }),
      HeightRecord.findAll({
        where: { profileId: req.params.id, recordDate: { [Op.gte]: startDate } },
        order: [['record_date', 'DESC']]
      })
    ]);

    res.json({ code: 0, data: { weightRecords, heightRecords } });
  } catch (err) { next(err); }
};

exports.updateRecord = async (req, res, next) => {
  try {
    const { type } = req.params; // 'weight' or 'height'
    const { value, recordDate, note } = req.body;

    if (type === 'weight') {
      const record = await WeightRecord.findByPk(req.params.recordId);
      if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });
      await record.update({ weight: value, recordDate, note });
      res.json({ code: 0, data: record, message: '更新成功' });
    } else if (type === 'height') {
      const record = await HeightRecord.findByPk(req.params.recordId);
      if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });
      await record.update({ height: value, recordDate, note });
      res.json({ code: 0, data: record, message: '更新成功' });
    } else {
      res.status(400).json({ code: 400, message: '无效的记录类型' });
    }
  } catch (err) { next(err); }
};

exports.deleteRecord = async (req, res, next) => {
  try {
    const { type } = req.params;
    if (type === 'weight') {
      const record = await WeightRecord.findByPk(req.params.recordId);
      if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });
      await record.destroy();
    } else if (type === 'height') {
      const record = await HeightRecord.findByPk(req.params.recordId);
      if (!record) return res.status(404).json({ code: 404, message: '记录不存在' });
      await record.destroy();
    } else {
      return res.status(400).json({ code: 400, message: '无效的记录类型' });
    }
    res.json({ code: 0, message: '已删除' });
  } catch (err) { next(err); }
};

// ===== 工具函数 =====
function stringifyArray(val) {
  if (!val) return '[]';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return JSON.stringify(val);
  return '[]';
}

function parseArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

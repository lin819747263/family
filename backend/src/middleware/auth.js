const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isTokenBlacklisted } = require('../controllers/authController');
const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

async function getUserById(userId) {
  const cached = userCache.get(userId);
  if (cached) return cached;
  const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
  if (user) userCache.set(userId, user.toJSON());
  return user;
}

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ code: 401, message: '未登录' });
    if (isTokenBlacklisted(token)) return res.status(401).json({ code: 401, message: '登录已失效，请重新登录' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(decoded.userId);
    if (!user || user.status === 'disabled') return res.status(401).json({ code: 401, message: '用户不存在或已禁用' });
    req.user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    return res.status(401).json({ code: 401, message: '身份验证失败' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await getUserById(decoded.userId);
      if (user && user.status === 'active') {
        req.user = typeof user.toJSON === 'function' ? user.toJSON() : user;
        req.userId = user.id;
      }
    }
  } catch (_) { /* ignore */ }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };

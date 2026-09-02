require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize } = require('./src/models');
const errorHandler = require('./src/middleware/errorHandler');
const { startScheduler } = require('./src/services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全配置
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', credentials: true }));

// 限流
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { code: 429, message: '请求过于频繁，请稍后再试' } });
app.use('/api', limiter);

// 请求日志
app.use(morgan('dev'));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 查询参数清理：pageSize 上限 100
app.use('/api', (req, res, next) => {
  if (req.query.pageSize) req.query.pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
  if (req.query.page) req.query.page = Math.max(parseInt(req.query.page) || 1, 1);
  next();
});

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/accounting', require('./src/routes/accounting'));
app.use('/api/album', require('./src/routes/album'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/anniversary', require('./src/routes/anniversary'));
app.use('/api/recipe', require('./src/routes/recipe'));
app.use('/api/family', require('./src/routes/family'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/moment', require('./src/routes/moment'));
app.use('/api/todo', require('./src/routes/todo'));
app.use('/api/member-profile', require('./src/routes/memberProfile'));
app.use('/api/calendar', require('./src/routes/calendar'));
app.use('/api/wishlist', require('./src/routes/wishlist'));
app.use('/api/diary', require('./src/routes/diary'));
app.use('/api/investment', require('./src/routes/investment'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/annual-goals', require('./src/routes/annualGoal'));

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 错误处理
app.use(errorHandler);

// 启动服务
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('数据表同步完成');
    } else {
      console.log('生产环境：跳过自动同步');
    }
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`家庭管理系统后端服务运行在 http://0.0.0.0:${PORT}`);
      startScheduler();
    });
  } catch (error) {
    console.error('启动失败:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;

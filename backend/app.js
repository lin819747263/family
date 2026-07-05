require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize } = require('./src/models');
const { RecurringBill, Transaction, Anniversary, FamilyMember, Notification, Todo } = require('./src/models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const errorHandler = require('./src/middleware/errorHandler');
const { calcNextRunDate } = require('./src/utils/recurring');
const { computeNextDate } = require('./src/utils/lunar');

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

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 错误处理
app.use(errorHandler);

// 定时记账自动执行
async function processRecurringBills() {
  try {
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');
    const currentHHmm = today.format('HH:mm');

    // 查找所有今天到期且到了触发时间的任务
    const bills = await RecurringBill.findAll({
      where: {
        active: true,
        nextRunDate: todayStr
      }
    });

    let processed = 0;

    for (const bill of bills) {
      try {
        // 检查触发时间：只有到了设定时间或之后才执行
        if (bill.triggerTime && currentHHmm < bill.triggerTime) continue;

        // 检查有效期
        if (bill.startDate && todayStr < bill.startDate) continue;
        if (bill.endDate && todayStr > bill.endDate) continue;

        // 检查今天是否已经执行过（通过 lastRunDate 判断）
        if (bill.lastRunDate === todayStr) continue;

        // 创建交易记录
        await Transaction.create({
          bookId: bill.bookId,
          type: bill.type,
          amount: bill.amount,
          categoryId: bill.categoryId,
          note: `[定时] ${bill.name}${bill.note ? ' - ' + bill.note : ''}`,
          transactionDate: todayStr,
          createdBy: bill.createdBy || 1,
          source: 'manual'
        });

        // 更新任务状态
        bill.lastRunDate = todayStr;
        bill.totalRuns = (bill.totalRuns || 0) + 1;
        bill.nextRunDate = calcNextRunDate(bill.toJSON());
        await bill.save();
        processed++;
      } catch (billErr) {
        console.error(`[定时记账] 任务 "${bill.name}"(ID:${bill.id}) 执行失败:`, billErr.message);
      }
    }

    if (processed > 0) {
      console.log(`[定时记账] 自动执行了 ${processed} 笔定时任务`);
    }
  } catch (err) {
    console.error('[定时记账] 执行失败:', err.message);
  }
}

// 纪念日提醒检查
async function checkAnniversaryReminders() {
  try {
    const today = dayjs().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');

    // 查找所有有效纪念日
    const anniversaries = await Anniversary.findAll({
      where: { status: 'active' }
    });

    let reminded = 0;

    for (const ann of anniversaries) {
      // 支持公历和农历纪念日
      const { nextDate, daysLeft } = computeNextDate(ann.toJSON(), today);
      const reminderDays = ann.reminderDays || 3;

      // 在提醒窗口内 且 今天还没发过提醒
      if (daysLeft >= 0 && daysLeft <= reminderDays) {
        // 检查今天是否已发送过该纪念日的提醒
        const existing = await Notification.findOne({
          where: {
            relatedId: ann.id,
            relatedType: 'anniversary',
            createdAt: { [Op.startsWith]: todayStr }
          }
        });
        if (existing) continue;

        // 获取该家庭的所有成员
        const members = await FamilyMember.findAll({
          where: { familyId: ann.familyId },
          attributes: ['userId']
        });

        // 为每个成员创建通知
        for (const m of members) {
          const daysText = daysLeft === 0 ? '就是今天' : `还有${daysLeft}天`;
          const title = daysLeft === 0 ? `🎉 ${ann.title}` : `📅 ${ann.title}即将到来`;
          const content = `${ann.title}${daysText}到来`;
          await Notification.create({
            userId: m.userId,
            type: 'anniversary',
            title,
            content,
            relatedId: ann.id,
            relatedType: 'anniversary'
          });
        }
        reminded++;
      }
    }

    if (reminded > 0) {
      console.log(`[纪念日提醒] 发送了 ${reminded} 条提醒`);
    }
  } catch (err) {
    console.error('[纪念日提醒] 执行失败:', err.message);
  }
}

// 待办提醒检查
async function checkTodoReminders() {
  try {
    const now = dayjs();
    const todayStr = now.format('YYYY-MM-DD');
    const currentHHmm = now.format('HH:mm');

    // 查找今天到期或已过期且未完成的待办
    const todos = await Todo.findAll({
      where: {
        status: 'active',
        completed: false,
        dueDate: { [Op.lte]: todayStr },
        reminderBefore: { [Op.gt]: 0 }
      }
    });

    let reminded = 0;

    for (const todo of todos) {
      try {
        const isOverdue = todo.dueDate < todayStr;
        const isToday = todo.dueDate === todayStr;

        // 如果有截止时间，检查是否到了提醒时间
        if (isToday && todo.dueTime && todo.reminderBefore > 0) {
          const dueMinutes = parseInt(todo.dueTime.split(':')[0]) * 60 + parseInt(todo.dueTime.split(':')[1]);
          const currentMinutes = parseInt(currentHHmm.split(':')[0]) * 60 + parseInt(currentHHmm.split(':')[1]);
          const remindAt = dueMinutes - todo.reminderBefore;
          // 还没到提醒时间，跳过
          if (currentMinutes < remindAt) continue;
        }

        // 检查今天是否已发送过该待办的提醒
        const existing = await Notification.findOne({
          where: {
            relatedId: todo.id,
            relatedType: 'todo',
            createdAt: { [Op.startsWith]: todayStr }
          }
        });
        if (existing) continue;

        // 获取该家庭的所有成员
        const members = await FamilyMember.findAll({
          where: { familyId: todo.familyId },
          attributes: ['userId']
        });

        let title, content;
        if (isOverdue) {
          const daysOverdue = now.diff(dayjs(todo.dueDate), 'day');
          title = `⚠️ 待办已过期`;
          content = `「${todo.title}」已过期${daysOverdue}天`;
        } else {
          title = `📋 待办即将到期`;
          content = `「${todo.title}」今天到期${todo.dueTime ? ' ' + todo.dueTime : ''}`;
        }

        for (const m of members) {
          await Notification.create({
            userId: m.userId,
            type: 'todo',
            title,
            content,
            relatedId: todo.id,
            relatedType: 'todo'
          });
        }
        reminded++;
      } catch (todoErr) {
        console.error(`[待办提醒] 任务 "${todo.title}"(ID:${todo.id}) 提醒失败:`, todoErr.message);
      }
    }

    if (reminded > 0) {
      console.log(`[待办提醒] 发送了 ${reminded} 条提醒`);
    }
  } catch (err) {
    console.error('[待办提醒] 执行失败:', err.message);
  }
}

// 启动服务
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    // 生产环境不自动同步表结构，需使用迁移
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('数据表同步完成');
    } else {
      console.log('生产环境：跳过自动同步');
    }
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`家庭管理系统后端服务运行在 http://0.0.0.0:${PORT}`);
      // 启动时立即执行一次
      processRecurringBills();
      checkAnniversaryReminders();
      checkTodoReminders();
      // 每5分钟检查一次定时任务
      setInterval(processRecurringBills, 5 * 60 * 1000);
      // 每小时检查一次纪念日提醒
      setInterval(checkAnniversaryReminders, 60 * 60 * 1000);
      // 每30分钟检查一次待办提醒
      setInterval(checkTodoReminders, 30 * 60 * 1000);
    });
  } catch (error) {
    console.error('启动失败:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;

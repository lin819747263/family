/**
 * 定时任务调度服务
 * - 周期性账单自动执行
 * - 纪念日提醒
 * - 待办提醒
 */
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { RecurringBill, Transaction, Anniversary, FamilyMember, Notification, Todo } = require('../models');
const { calcNextRunDate } = require('../utils/recurring');
const { computeNextDate } = require('../utils/lunar');

/**
 * 定时记账自动执行
 */
async function processRecurringBills() {
  try {
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');
    const currentHHmm = today.format('HH:mm');

    const bills = await RecurringBill.findAll({
      where: { active: true, nextRunDate: todayStr }
    });

    let processed = 0;

    for (const bill of bills) {
      try {
        if (bill.triggerTime && currentHHmm < bill.triggerTime) continue;
        if (bill.startDate && todayStr < bill.startDate) continue;
        if (bill.endDate && todayStr > bill.endDate) continue;
        if (bill.lastRunDate === todayStr) continue;

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

/**
 * 纪念日提醒检查
 */
async function checkAnniversaryReminders() {
  try {
    const today = dayjs().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');

    const anniversaries = await Anniversary.findAll({
      where: { status: 'active' }
    });

    let reminded = 0;

    for (const ann of anniversaries) {
      const { nextDate, daysLeft } = computeNextDate(ann.toJSON(), today);
      const reminderDays = ann.reminderDays || 3;

      if (daysLeft >= 0 && daysLeft <= reminderDays) {
        const existing = await Notification.findOne({
          where: {
            relatedId: ann.id,
            relatedType: 'anniversary',
            createdAt: { [Op.startsWith]: todayStr }
          }
        });
        if (existing) continue;

        const members = await FamilyMember.findAll({
          where: { familyId: ann.familyId },
          attributes: ['userId']
        });

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

/**
 * 待办提醒检查
 */
async function checkTodoReminders() {
  try {
    const now = dayjs();
    const todayStr = now.format('YYYY-MM-DD');
    const currentHHmm = now.format('HH:mm');

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

        if (isToday && todo.dueTime && todo.reminderBefore > 0) {
          const dueMinutes = parseInt(todo.dueTime.split(':')[0]) * 60 + parseInt(todo.dueTime.split(':')[1]);
          const currentMinutes = parseInt(currentHHmm.split(':')[0]) * 60 + parseInt(currentHHmm.split(':')[1]);
          const remindAt = dueMinutes - todo.reminderBefore;
          if (currentMinutes < remindAt) continue;
        }

        const existing = await Notification.findOne({
          where: {
            relatedId: todo.id,
            relatedType: 'todo',
            createdAt: { [Op.startsWith]: todayStr }
          }
        });
        if (existing) continue;

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

/**
 * 启动所有定时任务
 */
function startScheduler() {
  // 启动时立即执行一次
  processRecurringBills();
  checkAnniversaryReminders();
  checkTodoReminders();

  // 每5分钟检查一次定时账单
  setInterval(processRecurringBills, 5 * 60 * 1000);
  // 每小时检查一次纪念日提醒
  setInterval(checkAnniversaryReminders, 60 * 60 * 1000);
  // 每30分钟检查一次待办提醒
  setInterval(checkTodoReminders, 30 * 60 * 1000);

  console.log('[调度器] 定时任务已启动');
}

module.exports = { startScheduler, processRecurringBills, checkAnniversaryReminders, checkTodoReminders };

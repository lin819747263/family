const dayjs = require('dayjs');

/**
 * 计算周期性账单的下次执行日期
 * @param {Object} bill - 账单对象，包含 frequency, dayOfMonth, dayOfWeek, monthOfYear
 * @returns {string} YYYY-MM-DD 格式的日期
 */
function calcNextRunDate(bill) {
  const today = dayjs();
  const freq = bill.frequency;
  const day = bill.dayOfMonth || 1;

  if (freq === 'daily') return today.add(1, 'day').format('YYYY-MM-DD');

  if (freq === 'weekly') {
    const targetDay = bill.dayOfWeek ?? 1;
    let next = today.day(targetDay);
    if (next.isBefore(today, 'day') || next.isSame(today, 'day')) next = next.add(1, 'week');
    return next.format('YYYY-MM-DD');
  }

  if (freq === 'monthly') {
    let next = today.date(Math.min(day, today.daysInMonth()));
    if (next.isBefore(today, 'day') || next.isSame(today, 'day')) {
      next = today.add(1, 'month').date(Math.min(day, today.add(1, 'month').daysInMonth()));
    }
    return next.format('YYYY-MM-DD');
  }

  if (freq === 'quarterly') {
    const currentMonth = today.month();
    const quarterStart = Math.floor(currentMonth / 3) * 3;
    let targetMonth = quarterStart;
    let targetDay = Math.min(day, dayjs().month(targetMonth).daysInMonth());
    let next = dayjs().month(targetMonth).date(targetDay);
    if (next.isBefore(today, 'day') || next.isSame(today, 'day')) {
      targetMonth = quarterStart + 3;
      if (targetMonth > 11) targetMonth -= 12;
      targetDay = Math.min(day, dayjs().month(targetMonth).daysInMonth());
      next = today.add(1, 'quarter').month(targetMonth).date(targetDay);
    }
    return next.format('YYYY-MM-DD');
  }

  if (freq === 'yearly') {
    const m = (bill.monthOfYear || 1) - 1;
    const d = Math.min(day, dayjs().month(m).daysInMonth());
    let next = today.month(m).date(d);
    if (next.isBefore(today, 'day') || next.isSame(today, 'day')) next = next.add(1, 'year');
    return next.format('YYYY-MM-DD');
  }

  return today.add(1, 'day').format('YYYY-MM-DD');
}

module.exports = { calcNextRunDate };

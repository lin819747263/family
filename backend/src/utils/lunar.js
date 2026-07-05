const dayjs = require('dayjs');
const { Solar, Lunar } = require('lunar-javascript');

/**
 * 将农历日期转为公历日期
 */
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth) {
  const lunar = Lunar.fromYmd(lunarYear, lunarMonth * (isLeapMonth ? -1 : 1), lunarDay);
  const solar = lunar.getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

/**
 * 获取农历纪念日在指定公历年份的公历日期
 */
function getLunarAnniversarySolarDate(lunarDateStr, targetYear) {
  try {
    const { month, day, isLeapMonth } = JSON.parse(lunarDateStr);
    for (const lunarYear of [targetYear, targetYear - 1]) {
      try {
        const solar = lunarToSolar(lunarYear, month, day, isLeapMonth);
        if (solar.year === targetYear) {
          return {
            date: `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`,
            found: true
          };
        }
      } catch { /* 该年可能没有此闰月 */ }
    }
    return { date: null, found: false };
  } catch {
    return { date: null, found: false };
  }
}

/**
 * 计算纪念日的下一个公历日期和倒计时天数
 * @param {Object} item 纪念日对象 (plain object)
 * @param {Object} today dayjs对象
 * @returns {{ nextDate: string, daysLeft: number, age: number|null }}
 */
function computeNextDate(item, today) {
  // 非重复事件（如倒数日）：只计算到目标日期的天数，过期后返回 -1
  if (item.repeatYearly === false) {
    const targetDate = dayjs(item.date).startOf('day');
    const daysLeft = targetDate.diff(today, 'day');
    return { nextDate: item.date, daysLeft: daysLeft, age: null };
  }

  if (item.calendarType === 'lunar' && item.lunarDate) {
    const currentYear = today.year();
    for (let offset = 0; offset <= 1; offset++) {
      const targetYear = currentYear + offset;
      const { date, found } = getLunarAnniversarySolarDate(item.lunarDate, targetYear);
      if (found) {
        const nextDate = dayjs(date);
        const daysLeft = nextDate.diff(today, 'day');
        if (daysLeft >= 0) {
          const birthYear = item.date ? parseInt(item.date.substring(0, 4)) : null;
          const age = item.type === 'birthday' && birthYear ? targetYear - birthYear : null;
          return { nextDate: date, daysLeft, age };
        }
      }
    }
    return { nextDate: item.date, daysLeft: 0, age: null };
  }

  // 公历纪念日（每年重复）
  const origDate = dayjs(item.date);
  let nextDate = origDate.year(today.year());
  if (nextDate.isBefore(today)) {
    nextDate = nextDate.add(1, 'year');
  }
  const daysLeft = nextDate.diff(today, 'day');
  const age = item.type === 'birthday' ? today.year() - origDate.year() : null;
  return { nextDate: nextDate.format('YYYY-MM-DD'), daysLeft, age };
}

/**
 * 获取农历显示文本
 */
function getLunarDisplay(lunarDateStr) {
  try {
    const { month, day, isLeapMonth } = JSON.parse(lunarDateStr);
    const monthNames = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const dayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    return `${isLeapMonth ? '闰' : ''}${monthNames[month]}月${dayNames[day]}`;
  } catch {
    return null;
  }
}

module.exports = { lunarToSolar, getLunarAnniversarySolarDate, computeNextDate, getLunarDisplay };

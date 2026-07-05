import dayjs from 'dayjs'

// ===== 中国法定节假日（固定日期） =====
const fixedHolidays = [
  { name: '元旦', month: 1, day: 1, emoji: '🎆', color: '#667eea' },
  { name: '妇女节', month: 3, day: 8, emoji: '💐', color: '#f472b6' },
  { name: '植树节', month: 3, day: 12, emoji: '🌳', color: '#34d399' },
  { name: '劳动节', month: 5, day: 1, emoji: '💪', color: '#f97316' },
  { name: '青年节', month: 5, day: 4, emoji: '🌟', color: '#667eea' },
  { name: '儿童节', month: 6, day: 1, emoji: '🎈', color: '#f472b6' },
  { name: '建党节', month: 7, day: 1, emoji: '🚩', color: '#ef4444' },
  { name: '建军节', month: 8, day: 1, emoji: '⭐', color: '#f97316' },
  { name: '教师节', month: 9, day: 10, emoji: '📚', color: '#3b82f6' },
  { name: '国庆节', month: 10, day: 1, emoji: '🇨🇳', color: '#ef4444' },
  { name: '万圣节', month: 10, day: 31, emoji: '🎃', color: '#f97316' },
  { name: '平安夜', month: 12, day: 24, emoji: '🎄', color: '#34d399' },
  { name: '圣诞节', month: 12, day: 25, emoji: '🎅', color: '#ef4444' },
  { name: '除夕', month: 12, day: 31, emoji: '🧧', color: '#ef4444' }
]

// ===== 农历节日（大致日期，按公历估算） =====
// 注：精确农历需要专门的库，此处用近似公历日期
const lunarHolidaysApprox = [
  { name: '春节', month: 2, day: 1, emoji: '🧧', color: '#ef4444', range: [1, 2] },
  { name: '元宵节', month: 2, day: 15, emoji: '🏮', color: '#f97316', range: [2, 3] },
  { name: '龙抬头', month: 3, day: 1, emoji: '🐉', color: '#667eea', range: [2, 4] },
  { name: '端午节', month: 6, day: 1, emoji: '🐲', color: '#34d399', range: [5, 7] },
  { name: '七夕', month: 8, day: 1, emoji: '💕', color: '#f472b6', range: [7, 9] },
  { name: '中元节', month: 8, day: 15, emoji: '🪔', color: '#64748b', range: [8, 9] },
  { name: '中秋节', month: 9, day: 15, emoji: '🥮', color: '#fbbf24', range: [9, 10] },
  { name: '重阳节', month: 10, day: 15, emoji: '🏔️', color: '#f97316', range: [10, 11] },
  { name: '腊八节', month: 1, day: 8, emoji: '🥣', color: '#8b5cf6', range: [12, 1] },
  { name: '小年', month: 1, day: 23, emoji: '🧹', color: '#667eea', range: [1, 2] }
]

// ===== 二十四节气（近似日期） =====
const solarTerms = [
  { name: '小寒', month: 1, day: 6, emoji: '❄️', color: '#3b82f6' },
  { name: '大寒', month: 1, day: 20, emoji: '🥶', color: '#3b82f6' },
  { name: '立春', month: 2, day: 4, emoji: '🌱', color: '#34d399' },
  { name: '雨水', month: 2, day: 19, emoji: '🌧️', color: '#60a5fa' },
  { name: '惊蛰', month: 3, day: 6, emoji: '⚡', color: '#f97316' },
  { name: '春分', month: 3, day: 21, emoji: '🌸', color: '#f472b6' },
  { name: '清明', month: 4, day: 5, emoji: '🍃', color: '#34d399' },
  { name: '谷雨', month: 4, day: 20, emoji: '🌾', color: '#60a5fa' },
  { name: '立夏', month: 5, day: 6, emoji: '☀️', color: '#f97316' },
  { name: '小满', month: 5, day: 21, emoji: '🌿', color: '#34d399' },
  { name: '芒种', month: 6, day: 6, emoji: '🌾', color: '#fbbf24' },
  { name: '夏至', month: 6, day: 21, emoji: '🌞', color: '#ef4444' },
  { name: '小暑', month: 7, day: 7, emoji: '🌡️', color: '#f97316' },
  { name: '大暑', month: 7, day: 23, emoji: '🔥', color: '#ef4444' },
  { name: '立秋', month: 8, day: 7, emoji: '🍂', color: '#f97316' },
  { name: '处暑', month: 8, day: 23, emoji: '🍃', color: '#34d399' },
  { name: '白露', month: 9, day: 8, emoji: '💧', color: '#60a5fa' },
  { name: '秋分', month: 9, day: 23, emoji: '🍁', color: '#f97316' },
  { name: '寒露', month: 10, day: 8, emoji: '🌫️', color: '#94a3b8' },
  { name: '霜降', month: 10, day: 23, emoji: '🥶', color: '#3b82f6' },
  { name: '立冬', month: 11, day: 7, emoji: '🌨️', color: '#667eea' },
  { name: '小雪', month: 11, day: 22, emoji: '❄️', color: '#a5b4fc' },
  { name: '大雪', month: 12, day: 7, emoji: '☃️', color: '#3b82f6' },
  { name: '冬至', month: 12, day: 22, emoji: '🥟', color: '#667eea' }
]

/**
 * 获取即将到来的节假日和节气
 * @param {number} days - 未来多少天
 * @returns {Array} 排序后的列表
 */
export function getUpcomingEvents(days = 60) {
  const today = dayjs().startOf('day')
  const limit = today.add(days, 'day')
  const results = []

  // 固定节假日
  for (const h of fixedHolidays) {
    for (let year = today.year(); year <= today.year() + 1; year++) {
      let date = dayjs(`${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`)
      const diff = date.diff(today, 'day')
      if (diff >= 0 && date.isBefore(limit)) {
        results.push({ ...h, date: date.format('YYYY-MM-DD'), daysLeft: diff, type: 'holiday', year })
      }
    }
  }

  // 二十四节气
  for (const s of solarTerms) {
    for (let year = today.year(); year <= today.year() + 1; year++) {
      let date = dayjs(`${year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`)
      const diff = date.diff(today, 'day')
      if (diff >= 0 && date.isBefore(limit)) {
        results.push({ ...s, date: date.format('YYYY-MM-DD'), daysLeft: diff, type: 'solar', year })
      }
    }
  }

  // 按日期排序，去重（同名同年的只保留最近的）
  results.sort((a, b) => a.daysLeft - b.daysLeft)
  const seen = new Set()
  return results.filter(item => {
    const key = `${item.name}-${item.year}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 获取当前节气（今天或最近刚过的）
 */
export function getCurrentSolarTerm() {
  const today = dayjs().startOf('day')
  let current = null

  for (const s of solarTerms) {
    const date = dayjs(`${today.year()}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`)
    if (date.isBefore(today) || date.isSame(today)) {
      if (!current || date.isAfter(dayjs(current.date))) {
        current = { ...s, date: date.format('YYYY-MM-DD') }
      }
    }
  }
  return current
}

/**
 * 获取下一个节气
 */
export function getNextSolarTerm() {
  const today = dayjs().startOf('day')

  for (const s of solarTerms) {
    const date = dayjs(`${today.year()}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`)
    if (date.isAfter(today)) {
      return { ...s, date: date.format('YYYY-MM-DD'), daysLeft: date.diff(today, 'day') }
    }
  }
  // 跨年：取第一个
  const first = solarTerms[0]
  const nextYear = dayjs(`${today.year() + 1}-${String(first.month).padStart(2, '0')}-${String(first.day).padStart(2, '0')}`)
  return { ...first, date: nextYear.format('YYYY-MM-DD'), daysLeft: nextYear.diff(today, 'day') }
}

<template>
  <div class="calendar-page">
    <!-- 工具栏 -->
    <div class="cal-toolbar">
      <div class="view-toggle">
        <button class="vt-btn" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">周</button>
        <button class="vt-btn" :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">月</button>
      </div>
      <button class="btn ghost" @click="goToday">今天</button>
      <div class="cal-nav">
        <button class="cn-btn" @click="navigate(-1)">‹</button>
        <span class="cal-label">{{ periodLabel }}</span>
        <button class="cn-btn" @click="navigate(1)">›</button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="viewMode === 'month'" class="card month-card">
      <div class="month-grid">
        <div class="mg-weekday" v-for="w in ['一','二','三','四','五','六','日']" :key="w">{{ w }}</div>
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="mg-day"
          :class="{ other: !day.isCurrentMonth, today: day.isToday, has: day.events.length > 0 }"
        >
          <span class="mg-num">{{ day.day }}</span>
          <span
            v-for="(evt, i) in day.events.slice(0, 2)"
            :key="i"
            class="mg-evt"
            :style="{ background: evt.color }"
          >{{ evt.dueTime ? evt.dueTime + ' ' : '' }}{{ evt.title }}</span>
        </div>
      </div>
    </div>

    <!-- 周视图 -->
    <div v-else class="card week-card">
      <div class="week-grid">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="wg-col"
          :class="{ today: day.isToday }"
        >
          <div class="wg-head">
            <div class="wg-wd">{{ day.weekday }}</div>
            <div class="wg-num">{{ day.day }}</div>
          </div>
          <div
            v-for="evt in getEventsForDate(day.date)"
            :key="evt.type + '-' + evt.id"
            class="wg-evt"
            :style="{ background: evt.gradient || evt.color }"
          >
            <span class="tm">{{ evt.dueTime || '全天' }}</span>
            <b>{{ evt.title }}</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted } from 'vue'
import { calendarApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const viewMode = ref('month')
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)
const currentWeekStart = ref(dayjs().startOf('week'))
const monthEvents = ref([])

// 事件颜色映射
const colorMap = {
  rose: { bg: 'var(--rose)', gradient: 'linear-gradient(135deg,var(--rose),var(--rose-d))' },
  amber: { bg: 'var(--amber)', gradient: 'linear-gradient(135deg,var(--amber),var(--amber-d))' },
  sage: { bg: 'var(--sage)', gradient: 'linear-gradient(135deg,var(--sage),var(--sage-d))' },
  sky: { bg: 'var(--sky)', gradient: 'linear-gradient(135deg,var(--sky),var(--sky-d))' },
  terracotta: { bg: 'var(--terracotta)', gradient: 'linear-gradient(135deg,var(--terracotta),var(--terra-deep))' },
  plum: { bg: 'var(--plum)', gradient: 'linear-gradient(135deg,var(--plum),var(--plum-d))' },
}

function getEventColor(evt) {
  if (evt.type === 'anniversary') {
    const t = evt.annType
    if (t === 'birthday') return colorMap.rose
    if (t === 'holiday') return colorMap.sage
    return colorMap.terracotta
  }
  // 待办按优先级
  if (evt.priority === 'high') return colorMap.rose
  if (evt.priority === 'low') return colorMap.sage
  return colorMap.amber
}

// 周视图日期
const weekDays = computed(() => {
  const start = currentWeekStart.value
  return Array.from({ length: 7 }, (_, i) => {
    const date = start.add(i, 'day')
    return {
      date: date.format('YYYY-MM-DD'),
      day: date.date(),
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.day()],
      isToday: date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
    }
  })
})

// 获取某天的事件（周视图用）
function getEventsForDate(date) {
  return monthEvents.value.filter(e => e.date === date).map(e => {
    const c = getEventColor(e)
    return { ...e, color: c.bg, gradient: c.gradient }
  })
}

// 期间标签
const periodLabel = computed(() => {
  if (viewMode.value === 'week') {
    const start = currentWeekStart.value
    const end = start.add(6, 'day')
    if (start.month() === end.month()) {
      return `${start.year()}年${start.month() + 1}月`
    }
    return `${start.month() + 1}月 - ${end.month() + 1}月`
  }
  return `${currentYear.value}年${currentMonth.value}月`
})

// 构建月视图日历格子
const calendarDays = computed(() => {
  const firstDay = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`)
  const startWeekday = firstDay.day()
  const daysInMonth = firstDay.daysInMonth()
  const today = dayjs().format('YYYY-MM-DD')

  const days = []

  // 上月末尾
  const prevMonth = firstDay.subtract(1, 'month')
  const prevDays = prevMonth.daysInMonth()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevDays - i
    const date = prevMonth.date(d).format('YYYY-MM-DD')
    days.push({
      day: d, date, isCurrentMonth: false, isToday: date === today,
      events: monthEvents.value.filter(e => e.date === date)
    })
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = firstDay.date(d).format('YYYY-MM-DD')
    days.push({
      day: d, date, isCurrentMonth: true, isToday: date === today,
      events: monthEvents.value.filter(e => e.date === date)
    })
  }

  // 下月开头
  const remaining = 42 - days.length
  const nextMonth = firstDay.add(1, 'month')
  for (let d = 1; d <= remaining; d++) {
    const date = nextMonth.date(d).format('YYYY-MM-DD')
    days.push({
      day: d, date, isCurrentMonth: false, isToday: date === today,
      events: monthEvents.value.filter(e => e.date === date)
    })
  }

  return days
})

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadMonthEvents()
})

async function loadMonthEvents() {
  try {
    const res = await calendarApi.getMonthEvents({
      familyId: authStore.currentFamily?.id,
      year: currentYear.value,
      month: currentMonth.value
    })
    monthEvents.value = res.data || []
  } catch (e) { console.error(e) }
}

function navigate(delta) {
  if (viewMode.value === 'week') {
    currentWeekStart.value = currentWeekStart.value.add(delta * 7, 'day')
    const d = currentWeekStart.value
    currentYear.value = d.year()
    currentMonth.value = d.month() + 1
  } else {
    const d = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`).add(delta, 'month')
    currentYear.value = d.year()
    currentMonth.value = d.month() + 1
  }
  loadMonthEvents()
}

function goToday() {
  const today = dayjs()
  currentYear.value = today.year()
  currentMonth.value = today.month() + 1
  currentWeekStart.value = today.startOf('week')
  loadMonthEvents()
}
</script>

<style scoped>
.calendar-page { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* 工具栏 */
.cal-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
}
.view-toggle {
  display: flex; background: rgba(var(--cream-rgb), 0.6);
  border: 1px solid var(--border); border-radius: 12px; padding: 4px;
}
.vt-btn {
  padding: 8px 16px; border-radius: 9px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.25s;
}
.vt-btn:hover { color: var(--terra-deep); }
.vt-btn.active {
  background: var(--bg-card); color: var(--terra-deep);
  box-shadow: 0 3px 10px rgba(var(--shadow-rgb), 0.14);
}
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 17px; border-radius: 13px; border: none;
  cursor: pointer; font-size: 14px; font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}
.btn.ghost { background: rgba(var(--bg-card-rgb), 0.85); color: var(--terra-deep); border: 1.5px solid var(--border); }
.btn:hover { transform: translateY(-2px); }
.cal-nav { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.cn-btn {
  width: 34px; height: 34px; border-radius: 10px;
  border: 1.5px solid var(--border); background: rgba(var(--bg-card-rgb), 0.8);
  color: var(--text-secondary); cursor: pointer; font-size: 15px; transition: all 0.25s;
}
.cn-btn:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.cal-label { min-width: 110px; text-align: center; font-size: 15px; font-weight: 700; color: var(--terra-deep); }

/* ===== 月视图 ===== */
.month-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 16px;
}
.mg-weekday {
  text-align: center; font-size: 12px; font-weight: 700; color: var(--text-secondary); padding: 6px 0;
}
.mg-day {
  min-height: 86px; border-radius: 12px; padding: 8px;
  background: rgba(var(--cream-rgb), 0.35); border: 1px solid transparent;
  cursor: pointer; transition: all 0.25s;
  display: flex; flex-direction: column; gap: 5px;
}
.mg-day:hover {
  background: rgba(var(--cream-rgb), 0.8); border-color: var(--wood-light); transform: translateY(-2px);
}
.mg-day.other { opacity: 0.4; }
.mg-num {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.mg-day.today .mg-num {
  background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  color: var(--warm-white); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2);
  animation: ring 2.4s ease-in-out infinite;
}
@keyframes ring {
  0%, 100% { box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(var(--primary-rgb), 0.12); }
}
.mg-evt {
  font-size: 12px; font-weight: 600; padding: 2px 6px;
  border-radius: 6px; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ===== 周视图 ===== */
.week-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; padding: 16px;
}
.wg-col {
  border-radius: 14px; background: rgba(var(--cream-rgb), 0.35);
  padding: 10px 8px; display: flex; flex-direction: column; gap: 8px;
  min-height: 240px; transition: background 0.25s;
}
.wg-col:hover { background: rgba(var(--cream-rgb), 0.7); }
.wg-col.today {
  background: rgba(var(--primary-rgb), 0.12);
  box-shadow: inset 0 0 0 1.5px var(--terracotta);
}
.wg-head {
  text-align: center; padding-bottom: 8px; border-bottom: 1px dashed var(--border);
}
.wg-wd { font-size: 12px; color: var(--text-secondary); }
.wg-num { font-size: 18px; font-weight: 800; color: var(--terra-deep); margin-top: 2px; }
.wg-col.today .wg-num {
  color: var(--warm-white); background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin: 2px auto 0;
}
.wg-evt {
  border-radius: 10px; padding: 8px 9px; color: #fff;
  font-size: 11.5px; line-height: 1.4;
  box-shadow: 0 4px 10px rgba(var(--shadow-rgb), 0.18);
  transition: transform 0.25s; cursor: pointer;
}
.wg-evt:hover { transform: scale(1.04); }
.wg-evt b { display: block; font-size: 12px; }
.wg-evt .tm { opacity: 0.85; font-size: 12px; }

/* 响应式 */
@media (max-width: 960px) {
  .week-grid { overflow-x: auto; }
}
@media (max-width: 600px) {
  .month-grid { padding: 10px; gap: 4px; }
  .mg-day { min-height: 64px; }
  .mg-evt { display: none; }
  .mg-day.has::after {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: var(--terracotta); margin: 2px auto 0;
  }
}
</style>

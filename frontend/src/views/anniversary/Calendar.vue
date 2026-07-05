<template>
  <div class="calendar-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <div class="page-title">日历视图</div>
        <p class="page-desc">一目了然地查看每天的纪念日和待办事项</p>
      </div>
      <div class="header-actions">
        <el-button @click="goToday">今天</el-button>
        <el-button :icon="ArrowLeft" circle @click="changeMonth(-1)" />
        <span class="month-label">{{ currentYear }}年{{ currentMonth }}月</span>
        <el-button :icon="ArrowRight" circle @click="changeMonth(1)" />
      </div>
    </div>

    <!-- 日历主体 -->
    <div class="calendar-wrap card">
      <!-- 星期头部 -->
      <div class="cal-weekdays">
        <div v-for="w in weekdays" :key="w" class="cal-weekday">{{ w }}</div>
      </div>

      <!-- 日期格子 -->
      <div class="cal-grid">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="cal-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'is-today': day.isToday,
            'has-events': day.events.length > 0,
            'is-selected': selectedDate === day.date
          }"
          @click="selectDate(day)"
        >
          <div class="cal-day-num">{{ day.day }}</div>
          <div v-if="day.events.length > 0" class="cal-events">
            <div
              v-for="(evt, i) in day.events.slice(0, 3)"
              :key="i"
              class="cal-event-item"
              :class="[evt.type, { completed: evt.completed, overdue: evt.isOverdue }]"
              :style="{ borderLeftColor: evt.color }"
              :title="evt.title"
            >
              <span v-if="evt.type === 'anniversary'" class="evt-icon">📅</span>
              <span v-else class="evt-icon">✅</span>
              <span class="evt-text">{{ evt.title }}</span>
            </div>
            <div v-if="day.events.length > 3" class="cal-more">+{{ day.events.length - 3 }}项</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的事件详情 -->
    <div v-if="selectedDate" class="day-detail card">
      <div class="dd-header">
        <div class="dd-title">{{ formatSelectedDate }}</div>
        <el-tag v-if="selectedDayEvents.length" size="small" type="info" effect="plain">
          {{ selectedDayEvents.length }} 项
        </el-tag>
      </div>

      <div v-if="selectedDayEvents.length === 0" class="dd-empty">
        <el-icon :size="32" color="#cbd5e1"><Calendar /></el-icon>
        <p>这一天没有安排</p>
      </div>

      <div v-else class="dd-list">
        <div v-for="evt in selectedDayEvents" :key="evt.type + '-' + evt.id" class="dd-item" :class="{ completed: evt.completed, overdue: evt.isOverdue }">
          <div class="dd-dot" :style="{ background: evt.color }"></div>
          <div class="dd-body">
            <div class="dd-item-title">
              <span v-if="evt.type === 'anniversary'" class="dd-type-tag anniversary">纪念日</span>
              <span v-else class="dd-type-tag todo">待办</span>
              {{ evt.title }}
            </div>
            <div class="dd-meta">
              <span v-if="evt.annType" class="dd-ann-type">{{ annTypeLabel(evt.annType) }}</span>
              <span v-if="evt.lunarDisplay" class="dd-lunar">🌙 {{ evt.lunarDisplay }}</span>
              <span v-if="evt.dueTime" class="dd-time">⏰ {{ evt.dueTime }}</span>
              <span v-if="evt.priority" class="dd-priority" :class="evt.priority">{{ priorityLabel(evt.priority) }}</span>
              <span v-if="evt.completed" class="dd-done">✅ 已完成</span>
              <span v-if="evt.isOverdue" class="dd-overdue">⚠️ 已过期</span>
              <span v-if="evt.isToday && evt.type === 'anniversary'" class="dd-today">🎉 就是今天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, watch } from 'vue'
import { calendarApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const monthEvents = ref([])
const loading = ref(false)

// 构建日历格子
const calendarDays = computed(() => {
  const firstDay = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`)
  const startWeekday = firstDay.day() // 0=周日
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

const selectedDayEvents = computed(() => {
  return monthEvents.value.filter(e => e.date === selectedDate.value)
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = dayjs(selectedDate.value)
  const today = dayjs().format('YYYY-MM-DD')
  const isToday = selectedDate.value === today
  return `${d.format('M月D日')} ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()]}${isToday ? ' · 今天' : ''}`
})

function annTypeLabel(t) {
  return { birthday: '生日', anniversary: '纪念日', holiday: '节日', other: '其他' }[t] || t
}

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || p
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadMonthEvents()
})

async function loadMonthEvents() {
  loading.value = true
  try {
    const res = await calendarApi.getMonthEvents({
      familyId: authStore.currentFamily?.id,
      year: currentYear.value,
      month: currentMonth.value
    })
    monthEvents.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function changeMonth(delta) {
  const d = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`).add(delta, 'month')
  currentYear.value = d.year()
  currentMonth.value = d.month() + 1
  selectedDate.value = d.format('YYYY-MM-DD')
  loadMonthEvents()
}

function goToday() {
  const today = dayjs()
  currentYear.value = today.year()
  currentMonth.value = today.month() + 1
  selectedDate.value = today.format('YYYY-MM-DD')
  loadMonthEvents()
}

function selectDate(day) {
  selectedDate.value = day.date
  // 如果点击了其他月份的日期，切换到那个月
  if (!day.isCurrentMonth) {
    const d = dayjs(day.date)
    currentYear.value = d.year()
    currentMonth.value = d.month() + 1
    loadMonthEvents()
  }
}
</script>

<style scoped>
.calendar-page { animation: pageIn 0.4s ease-out; }
@keyframes pageIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-desc { font-size: 14px; color: #94a3b8; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.month-label { font-size: 18px; font-weight: 700; color: #1e293b; min-width: 100px; text-align: center; }

.card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

/* 日历 */
.calendar-wrap { padding: 20px; margin-bottom: 20px; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 8px; }
.cal-weekday { text-align: center; font-size: 13px; font-weight: 600; color: #94a3b8; padding: 8px 0; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-day { min-height: 100px; padding: 6px 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
.cal-day:hover { background: rgba(102, 126, 234, 0.06); }
.cal-day.other-month { opacity: 0.35; }
.cal-day.is-today { background: rgba(102, 126, 234, 0.08); }
.cal-day.is-today .cal-day-num { background: #667eea; color: #fff; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; }
.cal-day.is-selected { background: rgba(102, 126, 234, 0.12); box-shadow: inset 0 0 0 2px #667eea; }

.cal-day-num { font-size: 14px; font-weight: 500; color: #334155; margin-bottom: 4px; }
.cal-day.other-month .cal-day-num { color: #94a3b8; }

/* 事件条目 */
.cal-events { display: flex; flex-direction: column; gap: 2px; }
.cal-event-item {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  border-left: 2px solid;
  font-size: 11px;
  line-height: 1.3;
  background: rgba(0,0,0,0.02);
  overflow: hidden;
}
.cal-event-item.completed { opacity: 0.5; }
.cal-event-item.overdue { background: rgba(239, 68, 68, 0.06); }
.evt-icon { flex-shrink: 0; font-size: 10px; }
.evt-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-weight: 500;
}
.cal-event-item.completed .evt-text { text-decoration: line-through; color: #94a3b8; }

.cal-more { font-size: 10px; color: #94a3b8; padding-left: 4px; }

/* 日期详情 */
.day-detail { padding: 20px; }
.dd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dd-title { font-size: 17px; font-weight: 700; color: #1e293b; }

.dd-empty { text-align: center; padding: 32px; }
.dd-empty p { margin-top: 8px; color: #94a3b8; font-size: 13px; }

.dd-list { display: flex; flex-direction: column; gap: 10px; }
.dd-item { display: flex; gap: 12px; padding: 12px 14px; background: #f8fafc; border-radius: 12px; transition: all 0.2s; }
.dd-item:hover { background: #f1f5f9; }
.dd-item.completed { opacity: 0.6; }
.dd-item.overdue { border-left: 3px solid #ef4444; }

.dd-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
.dd-body { flex: 1; min-width: 0; }
.dd-item-title { font-size: 15px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.dd-type-tag { font-size: 11px; padding: 1px 6px; border-radius: 4px; font-weight: 500; }
.dd-type-tag.anniversary { background: rgba(102, 126, 234, 0.1); color: #667eea; }
.dd-type-tag.todo { background: rgba(245, 158, 11, 0.1); color: #d97706; }

.dd-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; font-size: 12px; color: #94a3b8; }
.dd-ann-type { background: #f1f5f9; padding: 0 6px; border-radius: 4px; }
.dd-lunar { color: #8b5cf6; }
.dd-time { color: #64748b; }
.dd-priority { padding: 0 6px; border-radius: 4px; font-weight: 500; }
.dd-priority.high { background: #fef2f2; color: #ef4444; }
.dd-priority.medium { background: #fffbeb; color: #d97706; }
.dd-priority.low { background: #ecfdf5; color: #10b981; }
.dd-done { color: #10b981; }
.dd-overdue { color: #ef4444; font-weight: 600; }
.dd-today { color: #667eea; font-weight: 600; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 12px; }
  .cal-day { min-height: 60px; padding: 4px; }
  .cal-day-num { font-size: 12px; }
  .cal-event-item { font-size: 10px; padding: 1px 3px; }
  .evt-icon { display: none; }
}
</style>

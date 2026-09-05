<template>
  <div class="calendar-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'week' }"
            @click="viewMode = 'week'"
          >
            <el-icon><Grid /></el-icon>
            周
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'month' }"
            @click="viewMode = 'month'"
          >
            <el-icon><Calendar /></el-icon>
            月
          </button>
        </div>
      </div>

      <div class="header-actions">
        <el-button @click="goToday">今天</el-button>
        <el-button :icon="ArrowLeft" circle @click="navigate(-1)" />
        <span class="period-label">{{ periodLabel }}</span>
        <el-button :icon="ArrowRight" circle @click="navigate(1)" />
      </div>
    </div>

    <!-- 周视图 -->
    <div v-if="viewMode === 'week'" class="week-view card">
      <!-- 星期头部 -->
      <div class="week-header">
        <div class="week-time-gutter"></div>
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="week-day-header"
          :class="{ 'is-today': day.isToday, 'is-selected': selectedDate === day.date }"
          @click="selectDate(day)"
        >
          <div class="wh-weekday">{{ day.weekday }}</div>
          <div class="wh-date" :class="{ 'today-circle': day.isToday }">{{ day.day }}</div>
        </div>
      </div>

      <!-- 时间轴 -->
      <div class="week-body" ref="weekBodyRef">
        <div class="week-time-grid">
          <!-- 时间行 -->
          <div v-for="hour in hours" :key="hour" class="hour-row">
            <div class="hour-label">{{ formatHour(hour) }}</div>
            <div class="hour-cells">
              <div
                v-for="day in weekDays"
                :key="day.date + '-' + hour"
                class="hour-cell"
                :class="{ 'is-today': day.isToday }"
                @click="selectDateTime(day.date, hour)"
              >
                <!-- 事件渲染 -->
                <div
                  v-for="evt in getEventsForHour(day.date, hour)"
                  :key="evt.type + '-' + evt.id"
                  class="week-event"
                  :class="[evt.type, { completed: evt.completed, overdue: evt.isOverdue }]"
                  :style="{ borderLeftColor: evt.color }"
                  @click.stop="selectDate({ date: day.date })"
                >
                  <span class="we-time" v-if="evt.dueTime">{{ evt.dueTime }}</span>
                  <span class="we-title">{{ evt.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 全天事件区域 -->
          <div class="allday-section">
            <div class="hour-label">全天</div>
            <div class="allday-cells">
              <div
                v-for="day in weekDays"
                :key="'allday-' + day.date"
                class="allday-cell"
                :class="{ 'is-today': day.isToday }"
              >
                <div
                  v-for="evt in getAlldayEvents(day.date)"
                  :key="evt.type + '-' + evt.id"
                  class="allday-event"
                  :class="[evt.type]"
                  :style="{ background: evt.color + '20', borderLeftColor: evt.color }"
                  @click="selectDate({ date: day.date })"
                >
                  <span class="ae-title">{{ evt.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-else class="month-view">
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { calendarApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, ArrowRight, Grid, Calendar } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

// 视图模式
const viewMode = ref('week')

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)
const currentWeekStart = ref(dayjs().startOf('week'))
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const monthEvents = ref([])
const loading = ref(false)
const weekBodyRef = ref(null)

// 小时列表 (6:00 - 23:00)
const hours = Array.from({ length: 18 }, (_, i) => i + 6)

// 周视图的日期数据
const weekDays = computed(() => {
  const start = currentWeekStart.value
  return Array.from({ length: 7 }, (_, i) => {
    const date = start.add(i, 'day')
    return {
      date: date.format('YYYY-MM-DD'),
      day: date.date(),
      weekday: weekdays[date.day()],
      isToday: date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
      isCurrentMonth: date.month() + 1 === currentMonth.value
    }
  })
})

// 期间标签
const periodLabel = computed(() => {
  if (viewMode.value === 'week') {
    const start = currentWeekStart.value
    const end = start.add(6, 'day')
    if (start.month() === end.month()) {
      return `${start.year()}年${start.month() + 1}月${start.date()}日 - ${end.date()}日`
    }
    return `${start.month() + 1}月${start.date()}日 - ${end.month() + 1}月${end.date()}日`
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

// 获取某小时的事件
function getEventsForHour(date, hour) {
  return monthEvents.value.filter(e => {
    if (e.date !== date || !e.dueTime) return false
    const eventHour = parseInt(e.dueTime.split(':')[0])
    return eventHour === hour
  })
}

// 获取全天事件（无时间的事件）
function getAlldayEvents(date) {
  return monthEvents.value.filter(e => e.date === date && !e.dueTime)
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

function annTypeLabel(t) {
  return { birthday: '生日', anniversary: '纪念日', holiday: '节日', other: '其他' }[t] || t
}

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || p
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadMonthEvents()
  nextTick(() => scrollToCurrentTime())
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

// 导航（上/下）
function navigate(delta) {
  if (viewMode.value === 'week') {
    currentWeekStart.value = currentWeekStart.value.add(delta * 7, 'day')
    const d = currentWeekStart.value
    currentYear.value = d.year()
    currentMonth.value = d.month() + 1
    loadMonthEvents()
  } else {
    const d = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`).add(delta, 'month')
    currentYear.value = d.year()
    currentMonth.value = d.month() + 1
    selectedDate.value = d.format('YYYY-MM-DD')
    loadMonthEvents()
  }
}

function goToday() {
  const today = dayjs()
  currentYear.value = today.year()
  currentMonth.value = today.month() + 1
  currentWeekStart.value = today.startOf('week')
  selectedDate.value = today.format('YYYY-MM-DD')
  loadMonthEvents()
  if (viewMode.value === 'week') {
    nextTick(() => scrollToCurrentTime())
  }
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

function selectDateTime(date, hour) {
  selectedDate.value = date
}

// 滚动到当前时间
function scrollToCurrentTime() {
  if (!weekBodyRef.value) return
  const now = dayjs()
  const currentHour = now.hour()
  const targetHour = Math.max(6, currentHour - 1)
  const rowHeight = 60 // 每行高度
  weekBodyRef.value.scrollTop = targetHour * rowHeight
}
</script>

<style scoped>
.calendar-page { animation: pageIn 0.4s ease-out; }
@keyframes pageIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.period-label { font-size: 18px; font-weight: 700; color: #1e293b; min-width: 160px; text-align: center; }

/* 视图切换 */
.view-toggle {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.view-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
}
.view-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.06);
}
.view-btn.active {
  background: #fff;
  color: #667eea;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

/* ========== 周视图 ========== */
.week-view {
  margin-bottom: 20px;
  overflow: hidden;
}

.week-header {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
}

.week-time-gutter {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #f1f5f9;
}

.week-day-header {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid #f8fafc;
}

.week-day-header:last-child {
  border-right: none;
}

.week-day-header:hover {
  background: rgba(102, 126, 234, 0.04);
}

.week-day-header.is-today {
  background: rgba(102, 126, 234, 0.06);
}

.week-day-header.is-selected {
  background: rgba(102, 126, 234, 0.1);
}

.wh-weekday {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 4px;
}

.wh-date {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border-radius: 50%;
}

.today-circle {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.week-body {
  max-height: 500px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.week-body::-webkit-scrollbar {
  width: 6px;
}

.week-body::-webkit-scrollbar-track {
  background: transparent;
}

.week-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.week-time-grid {
  position: relative;
}

.hour-row {
  display: flex;
  min-height: 60px;
  border-bottom: 1px solid #f8fafc;
}

.hour-label {
  width: 60px;
  flex-shrink: 0;
  padding: 8px 12px 0 0;
  text-align: right;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  border-right: 1px solid #f1f5f9;
}

.hour-cells {
  flex: 1;
  display: flex;
}

.hour-cell {
  flex: 1;
  border-right: 1px solid #f8fafc;
  padding: 2px 4px;
  min-height: 60px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.hour-cell:last-child {
  border-right: none;
}

.hour-cell:hover {
  background: rgba(102, 126, 234, 0.04);
}

.hour-cell.is-today {
  background: rgba(102, 126, 234, 0.02);
}

/* 周视图事件 */
.week-event {
  padding: 3px 6px;
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 12px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.week-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.week-event.completed {
  opacity: 0.6;
}

.week-event.overdue {
  background: rgba(239, 68, 68, 0.08);
}

.we-time {
  font-size: 10px;
  color: #94a3b8;
  margin-right: 4px;
}

.we-title {
  font-weight: 500;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.week-event.completed .we-title {
  text-decoration: line-through;
  color: #94a3b8;
}

/* 全天事件区域 */
.allday-section {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.allday-cells {
  flex: 1;
  display: flex;
}

.allday-cell {
  flex: 1;
  padding: 4px;
  border-right: 1px solid #f1f5f9;
  min-height: 40px;
}

.allday-cell:last-child {
  border-right: none;
}

.allday-event {
  padding: 2px 6px;
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 11px;
  margin-bottom: 2px;
  cursor: pointer;
}

.ae-title {
  font-weight: 500;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 月视图 ========== */
.month-view {
  margin-bottom: 20px;
}

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

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .period-label {
    font-size: 16px;
    min-width: auto;
  }

  .week-time-gutter,
  .hour-label {
    width: 45px;
  }

  .hour-label {
    font-size: 10px;
    padding-right: 6px;
  }

  .wh-date {
    font-size: 16px;
    width: 30px;
    height: 30px;
  }

  .cal-day { min-height: 60px; padding: 4px; }
  .cal-day-num { font-size: 12px; }
  .cal-event-item { font-size: 10px; padding: 1px 3px; }
  .evt-icon { display: none; }
}
</style>

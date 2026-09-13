<template>
  <div class="habit-page">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div>
        <div class="page-title">✅ 习惯打卡</div>
        <div class="page-sub">每天一点点，坚持就是胜利</div>
      </div>
      <button class="btn primary" @click="openCreate">＋ 新建习惯</button>
    </div>

    <!-- 今日概览 -->
    <div class="today-banner reveal">
      <div class="today-date">
        <div class="day">{{ todayDay }}</div>
        <div class="month">{{ todayMonth }} · 周{{ todayWeekday }}</div>
      </div>
      <div class="today-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="var(--cream)" stroke-width="6"/>
          <circle cx="40" cy="40" r="32" fill="none" stroke="var(--sage)" stroke-width="6" stroke-linecap="round"
            :stroke-dasharray="ringDash + ' ' + ringCirc" />
        </svg>
        <div class="ring-text"><span class="ring-num">{{ doneToday }}/{{ habits.length }}</span><span class="ring-label">今日完成</span></div>
      </div>
      <div class="today-summary">
        <h3>{{ todayMessage }}</h3>
        <p>今天已完成 {{ doneToday }} 个习惯{{ habits.length - doneToday > 0 ? `，还有 ${habits.length - doneToday} 个等你完成` : '' }}</p>
      </div>
      <div class="today-streaks">
        <div class="streak-badge"><span class="fire">🔥</span> 最长连续 {{ maxStreak }} 天</div>
        <div class="streak-badge"><span class="fire">📊</span> 完成率 {{ todayPercent }}%</div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stats-grid reveal">
      <div class="stat-card"><div class="stat-num">{{ stats.total }}</div><div class="stat-lbl">习惯总数</div></div>
      <div class="stat-card"><div class="stat-num sage">{{ stats.doneToday }}</div><div class="stat-lbl">今日已完成</div></div>
      <div class="stat-card"><div class="stat-num amber">{{ stats.totalChecks }}</div><div class="stat-lbl">累计打卡</div></div>
      <div class="stat-card"><div class="stat-num rose">{{ stats.avgRate }}%</div><div class="stat-lbl">近30天完成率</div></div>
    </div>

    <!-- 视图切换 -->
    <div class="view-tabs reveal">
      <button class="vtab" :class="{ active: viewMode === 'today' }" @click="viewMode = 'today'">今日打卡</button>
      <button class="vtab" :class="{ active: viewMode === 'heatmap' }" @click="viewMode = 'heatmap'">热力图</button>
    </div>

    <!-- 今日打卡视图 -->
    <div v-if="viewMode === 'today'">
      <!-- 周导航 -->
      <div class="week-nav">
        <button class="btn sm ghost" @click="changeWeek(-1)">←</button>
        <div class="week-label">{{ weekLabel }}</div>
        <button class="btn sm ghost" @click="changeWeek(1)">→</button>
      </div>
      <div class="week-dots">
        <div
          v-for="(d, i) in weekDates"
          :key="i"
          class="week-dot"
          :class="{ active: formatDate(d) === selectedDate, today: formatDate(d) === today }"
          @click="selectedDate = formatDate(d)"
        >
          <span class="wd-name">周{{ weekDayNames[i] }}</span>
          <span class="wd-num">{{ d.getDate() }}</span>
          <span class="wd-status" :class="getDayStatus(d)"></span>
        </div>
      </div>

      <!-- 习惯列表 -->
      <div v-if="loading" class="card" style="text-align:center;padding:48px">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <div v-else-if="habits.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-title">还没有习惯</div>
        <div class="empty-desc">创建第一个习惯，开始你的打卡之旅</div>
        <button class="btn primary" @click="openCreate">＋ 新建习惯</button>
      </div>
      <div v-else class="habit-list">
        <div
          v-for="h in habits"
          :key="h.id"
          class="habit-card"
          :class="{ checked: isDayChecked(h, selectedDate) }"
        >
          <div class="habit-icon" :class="'hi-' + h.color">{{ h.icon }}</div>
          <div class="habit-info">
            <div class="habit-name">{{ h.name }}</div>
            <div class="habit-meta">
              <span v-if="getStreak(h) > 0" class="habit-streak">🔥 {{ getStreak(h) }}天</span>
              <span>{{ freqLabel(h.freq) }}</span>
              <span v-if="h.remindTime">⏰ {{ h.remindTime }}</span>
            </div>
          </div>
          <div class="habit-week">
            <div
              v-for="(d, i) in weekDates"
              :key="i"
              class="hw-dot"
              :class="{ done: isDayChecked(h, formatDate(d)), 'today-dot': formatDate(d) === today, future: formatDate(d) > today }"
              @click="formatDate(d) <= today && toggleDay(h, formatDate(d))"
            >{{ weekDayNames[i] }}</div>
          </div>
          <button
            class="habit-check"
            :class="{ checked: isDayChecked(h, selectedDate) }"
            @click="toggleCheck(h)"
          >✓</button>
          <div class="habit-actions">
            <button class="ha-btn" @click="openEdit(h)" title="编辑">✏️</button>
            <el-popconfirm title="确定删除此习惯？" @confirm="deleteHabit(h.id)">
              <template #reference><button class="ha-btn" title="删除">🗑</button></template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 热力图视图 -->
    <div v-if="viewMode === 'heatmap'" :key="'heatmap-' + habits.map(h => h.records?.length || 0).join('-')">
      <!-- 总热力图 -->
      <div class="heatmap-section">
        <div class="section-title">📊 打卡热力图（近半年）</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">今日: {{ today }} · 记录数: {{ habits.map(h => (h.records||[]).length).join(',') }}</div>
        <div v-if="habits.length === 0" style="text-align:center;padding:20px;color:var(--text-secondary);">暂无习惯数据</div>
        <template v-else>
          <div class="heatmap-wrap">
            <div class="heatmap">
              <div v-for="(col, w) in heatmapData" :key="w" class="heatmap-col">
                <div
                  v-for="(cell, d) in col"
                  :key="d"
                  class="hm-cell"
                  :class="cell.level"
                  :title="cell.date ? cell.date + ': ' + cell.count + '/' + habits.length : ''"
                  :style="{ visibility: cell.date ? 'visible' : 'hidden' }"
                ></div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>少</span>
              <div class="hm-legend-cell" style="background:var(--cream)"></div>
              <div class="hm-legend-cell" style="background:#C5D9B2"></div>
              <div class="hm-legend-cell" style="background:#A8C48A"></div>
              <div class="hm-legend-cell" style="background:#8BB066"></div>
              <div class="hm-legend-cell" style="background:#6B9B4A"></div>
              <span>多</span>
            </div>
          </div>

          <!-- 每个习惯的热力图 -->
          <div class="per-habit-heatmaps">
            <div v-for="h in habits" :key="h.id" class="phm-item">
              <div class="section-title">{{ h.icon }} {{ h.name }} <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">（{{ h.records?.length || 0 }} 条记录）</span></div>
              <div class="heatmap-wrap">
                <div class="heatmap">
                  <div v-for="(col, w) in getHabitHeatmap(h)" :key="w" class="heatmap-col">
                    <div
                      v-for="(cell, d) in col"
                      :key="d"
                      class="hm-cell"
                      :class="{ 'l4': cell.done }"
                      :title="cell.date || ''"
                      :style="{ visibility: cell.date ? 'visible' : 'hidden' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="isEdit ? '编辑习惯' : '新建习惯'" width="520px" destroy-on-close append-to-body class="warm-dialog">
      <div class="form-group">
        <label class="form-label">习惯名称</label>
        <el-input v-model="form.name" placeholder="比如「早起」「读书」「冥想」" maxlength="30" />
      </div>
      <div class="form-group">
        <label class="form-label">选择图标</label>
        <div class="icon-picker">
          <div v-for="ic in ICONS" :key="ic" class="icon-opt" :class="{ active: form.icon === ic }" @click="form.icon = ic">{{ ic }}</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">颜色</label>
        <div class="color-picker">
          <div v-for="c in COLORS" :key="c.key" class="color-opt" :class="{ active: form.color === c.key }" :style="{ background: c.bg }" @click="form.color = c.key"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">打卡频率</label>
        <div class="freq-options">
          <div class="freq-opt" :class="{ active: form.freq === 'daily' }" @click="form.freq = 'daily'">每天</div>
          <div class="freq-opt" :class="{ active: form.freq === 'weekday' }" @click="form.freq = 'weekday'">工作日</div>
          <div class="freq-opt" :class="{ active: form.freq === 'custom' }" @click="form.freq = 'custom'">自定义</div>
        </div>
        <div v-if="form.freq === 'custom'" class="weekday-picker">
          <div
            v-for="(d, i) in weekDayNames"
            :key="i"
            class="wd-opt"
            :class="{ active: form.weekdays.includes(i + 1) }"
            @click="toggleWeekday(i + 1)"
          >{{ d }}</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">提醒时间（可选）</label>
        <el-time-picker v-model="form.remindTime" placeholder="选择时间" format="HH:mm" value-format="HH:mm" style="max-width:200px" />
      </div>
      <div class="form-group">
        <label class="form-label">目标（连续天数）</label>
        <el-input-number v-model="form.goalDays" :min="1" :max="365" placeholder="比如 30" style="max-width:200px" />
      </div>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { habitApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const ICONS = ['🏃','📚','🧘','💧','🥗','😴','✍️','🎸','🌅','💪','🧹','💊','🍎','🚶','🎯','📝']
const COLORS = [
  { key: 'sage', bg: 'linear-gradient(135deg,var(--sage),var(--sage-d))' },
  { key: 'terra', bg: 'linear-gradient(135deg,var(--terracotta),var(--terra-deep))' },
  { key: 'amber', bg: 'linear-gradient(135deg,var(--amber),var(--amber-d))' },
  { key: 'sky', bg: 'linear-gradient(135deg,var(--sky),var(--sky-d))' },
  { key: 'rose', bg: 'linear-gradient(135deg,var(--rose),var(--rose-d))' },
  { key: 'plum', bg: 'linear-gradient(135deg,var(--plum),#8A6B92)' },
]
const weekDayNames = ['一', '二', '三', '四', '五', '六', '日']

// ===== 状态 =====
const habits = ref([])
const loading = ref(false)
const stats = reactive({ total: 0, doneToday: 0, totalChecks: 0, avgRate: 0 })
const viewMode = ref('today')
const weekOffset = ref(0)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const today = dayjs().format('YYYY-MM-DD')

// 表单
const showForm = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const form = reactive({
  name: '', icon: '🏃', color: 'sage', freq: 'daily',
  weekdays: [1, 2, 3, 4, 5], remindTime: null, goalDays: null
})

// ===== 计算属性 =====
const todayDay = computed(() => dayjs().date())
const todayMonth = computed(() => dayjs().format('YYYY年M月'))
const todayWeekday = computed(() => ['日', '一', '二', '三', '四', '五', '六'][dayjs().day()])

const doneToday = computed(() => habits.value.filter(h => isDayChecked(h, today)).length)
const todayPercent = computed(() => habits.value.length > 0 ? Math.round(doneToday.value / habits.value.length * 100) : 0)
const ringCirc = computed(() => 2 * Math.PI * 32)
const ringDash = computed(() => ringCirc.value * todayPercent.value / 100)
const maxStreak = computed(() => Math.max(0, ...habits.value.map(h => getStreak(h))))

const todayMessage = computed(() => {
  const pct = todayPercent.value
  if (pct === 100) return '🎉 全部完成！太棒了！'
  if (pct >= 60) return '加油，快完成了！'
  if (pct > 0) return '今天也要努力哦'
  return '新的一天，开始打卡吧'
})

const weekDates = computed(() => {
  const base = dayjs().add(weekOffset.value * 7, 'day')
  const day = base.day() || 7
  const mon = base.subtract(day - 1, 'day')
  return Array.from({ length: 7 }, (_, i) => mon.add(i, 'day').toDate())
})

const weekLabel = computed(() => {
  const d1 = weekDates.value[0]
  const d6 = weekDates.value[6]
  return `${d1.getMonth() + 1}月${d1.getDate()}日 — ${d6.getMonth() + 1}月${d6.getDate()}日`
})

function getHeatmapDates() {
  const weeks = 26
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - weeks * 7 + 1)
  const startDay = start.getDay() || 7
  start.setDate(start.getDate() - (startDay - 1))
  const dates = []
  for (let w = 0; w < weeks + 1; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * 7 + d)
      dates.push(formatDate(dt))
    }
  }
  return dates
}

const heatmapDates = computed(() => getHeatmapDates())

const heatmapData = computed(() => {
  const dates = heatmapDates.value
  const todayStr = today
  const cols = []
  for (let w = 0; w < dates.length / 7; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const key = dates[w * 7 + d]
      if (key > todayStr) {
        col.push({ date: '', count: 0, level: '' })
        continue
      }
      const count = habits.value.filter(h => (h.records || []).some(r => r.date === key)).length
      const total = habits.value.length || 1
      const ratio = count / total
      let level = ''
      if (ratio > 0 && ratio <= 0.25) level = 'l1'
      else if (ratio > 0.25 && ratio <= 0.5) level = 'l2'
      else if (ratio > 0.5 && ratio <= 0.75) level = 'l3'
      else if (ratio > 0.75) level = 'l4'
      col.push({ date: key, count, level })
    }
    cols.push(col)
  }
  return cols
})

function getHabitHeatmap(habit) {
  const dates = heatmapDates.value
  const todayStr = today
  const cols = []
  for (let w = 0; w < dates.length / 7; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const key = dates[w * 7 + d]
      if (key > todayStr) {
        col.push({ date: '', done: false })
        continue
      }
      const done = (habit.records || []).some(r => r.date === key)
      col.push({ date: key, done })
    }
    cols.push(col)
  }
  return cols
}

// ===== 工具函数 =====
function formatDate(d) {
  if (typeof d === 'string') return d
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function freqLabel(f) {
  return { daily: '每天', weekday: '工作日', custom: '自定义' }[f] || f
}

function isDayChecked(h, date) {
  return (h.records || []).some(r => r.date === date)
}

function getStreak(h) {
  let streak = 0
  const d = new Date(today)
  while (true) {
    const key = formatDate(d)
    if (isDayChecked(h, key)) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
}

function getDayStatus(d) {
  const key = formatDate(d)
  const doneCount = habits.value.filter(h => isDayChecked(h, key)).length
  if (doneCount === habits.value.length && habits.value.length > 0) return 'done'
  if (doneCount > 0) return 'partial'
  return ''
}

function changeWeek(delta) { weekOffset.value += delta }
function toggleWeekday(day) {
  const idx = form.weekdays.indexOf(day)
  if (idx >= 0) form.weekdays.splice(idx, 1)
  else form.weekdays.push(day)
}

// ===== 数据加载 =====
async function loadData() {
  const familyId = authStore.currentFamily?.id
  if (!familyId) return
  loading.value = true
  try {
    const [habitsRes, statsRes] = await Promise.all([
      habitApi.getList({ familyId }),
      habitApi.getStats({ familyId })
    ])
    habits.value = habitsRes.data || []
    Object.assign(stats, statsRes.data || { total: 0, doneToday: 0, totalChecks: 0, avgRate: 0 })
    nextTick(() => observeReveal())
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(loadData)
watch(() => authStore.currentFamily, (f) => { if (f) loadData() })
watch(viewMode, () => { nextTick(() => observeReveal()) })

// ===== 习惯操作 =====
function openCreate() {
  isEdit.value = false; editId.value = null
  form.name = ''; form.icon = '🏃'; form.color = 'sage'
  form.freq = 'daily'; form.weekdays = [1, 2, 3, 4, 5]
  form.remindTime = null; form.goalDays = null
  showForm.value = true
}

function openEdit(h) {
  isEdit.value = true; editId.value = h.id
  form.name = h.name; form.icon = h.icon; form.color = h.color
  form.freq = h.freq; form.weekdays = h.weekdays || [1, 2, 3, 4, 5]
  form.remindTime = h.remindTime; form.goalDays = h.goalDays
  showForm.value = true
}

async function handleSave() {
  if (!form.name.trim()) return ElMessage.warning('请输入习惯名称')
  saving.value = true
  try {
    const data = {
      name: form.name.trim(), icon: form.icon, color: form.color,
      freq: form.freq, weekdays: form.freq === 'custom' ? form.weekdays : null,
      remindTime: form.remindTime, goalDays: form.goalDays,
      familyId: authStore.currentFamily?.id
    }
    if (isEdit.value) {
      await habitApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await habitApi.create(data)
      ElMessage.success('习惯创建成功')
    }
    showForm.value = false
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function deleteHabit(id) {
  try {
    await habitApi.remove(id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) { ElMessage.error('删除失败') }
}

async function toggleCheck(h) {
  try {
    await habitApi.check(h.id, selectedDate.value)
    await refreshHabits()
  } catch (e) { ElMessage.error('操作失败') }
}

async function toggleDay(h, date) {
  try {
    await habitApi.check(h.id, date)
    await refreshHabits()
  } catch (e) { ElMessage.error('操作失败') }
}

async function refreshHabits() {
  const familyId = authStore.currentFamily?.id
  const [habitsRes, statsRes] = await Promise.all([
    habitApi.getList({ familyId }),
    habitApi.getStats({ familyId })
  ])
  habits.value = habitsRes.data || []
  Object.assign(stats, statsRes.data || {})
  nextTick(() => observeReveal())
}

// ===== 渐入动画 =====
let revealIO = null
function observeReveal() {
  if (!revealIO) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target) }
      })
    }, { threshold: 0.12 })
  }
  nextTick(() => {
    document.querySelectorAll('.habit-page .reveal:not(.in)').forEach((el, i) => {
      if (!el.dataset.d) el.dataset.d = (i % 6) * 60
      el.style.transitionDelay = el.dataset.d + 'ms'
      revealIO.observe(el)
    })
  })
}
</script>

<style scoped>
.habit-page { position: relative; }

/* ===== 页头 ===== */
.page-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
.page-title { font-size: 24px; font-weight: 800; color: var(--terra-deep); }
.page-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 17px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.3s, box-shadow 0.3s; }
.btn.primary { background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4); }
.btn.ghost { background: rgba(255, 253, 250, 0.85); color: var(--terra-deep); border: 1.5px solid var(--border); }
.btn.sm { padding: 7px 13px; font-size: 13px; border-radius: 10px; }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.3); }

/* ===== 今日概览 ===== */
.today-banner { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); padding: 20px 24px; margin-bottom: 22px; box-shadow: 0 8px 28px rgba(160, 120, 90, 0.08); display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.today-date { text-align: center; min-width: 70px; }
.today-date .day { font-size: 36px; font-weight: 800; color: var(--terra-deep); line-height: 1; }
.today-date .month { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.today-ring { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.today-ring svg { transform: rotate(-90deg); }
.today-ring .ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-num { font-size: 20px; font-weight: 800; color: var(--terra-deep); }
.ring-label { font-size: 10px; color: var(--text-secondary); }
.today-summary { flex: 1; min-width: 200px; }
.today-summary h3 { font-size: 16px; font-weight: 700; color: var(--terra-deep); margin-bottom: 6px; }
.today-summary p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.today-streaks { display: flex; gap: 12px; flex-wrap: wrap; }
.streak-badge { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 12px; background: rgba(243, 234, 221, 0.4); border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--terra-deep); }
.streak-badge .fire { font-size: 18px; }

/* ===== 统计 ===== */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 22px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md, 16px); padding: 16px; text-align: center; box-shadow: 0 4px 16px rgba(160, 120, 90, 0.06); }
.stat-num { font-size: 28px; font-weight: 800; color: var(--terra-deep); }
.stat-num.sage { color: var(--sage-d, #7E8862); }
.stat-num.amber { color: var(--amber-d, #C08A3E); }
.stat-num.rose { color: var(--rose-d, #B06A6A); }
.stat-lbl { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

/* ===== 视图切换 ===== */
.view-tabs { display: flex; gap: 6px; margin-bottom: 18px; }
.vtab { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--border); background: rgba(255, 253, 250, 0.8); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.vtab:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.vtab.active { background: rgba(200, 159, 133, 0.14); border-color: var(--terracotta); color: var(--terra-deep); }

/* ===== 周视图 ===== */
.week-nav { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.week-label { font-size: 15px; font-weight: 700; color: var(--terra-deep); min-width: 180px; text-align: center; }
.week-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 18px; }
.week-dot { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 10px; border-radius: 14px; cursor: pointer; transition: all 0.25s; min-width: 52px; }
.week-dot:hover { background: rgba(200, 159, 133, 0.08); }
.week-dot.active { background: rgba(200, 159, 133, 0.14); }
.week-dot.today { position: relative; }
.week-dot.today::after { content: ""; position: absolute; bottom: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--terracotta); }
.wd-name { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
.wd-num { font-size: 18px; font-weight: 800; color: var(--terra-deep); }
.wd-status { width: 8px; height: 8px; border-radius: 50%; background: var(--cream); border: 1.5px solid var(--border); }
.wd-status.done { background: var(--sage); border-color: var(--sage); }
.wd-status.partial { background: var(--amber); border-color: var(--amber); }

/* ===== 习惯卡片 ===== */
.habit-list { display: flex; flex-direction: column; gap: 12px; }
.habit-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); box-shadow: 0 6px 20px rgba(160, 120, 90, 0.06); padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: all 0.3s; }
.habit-card:hover { box-shadow: 0 10px 30px rgba(160, 120, 90, 0.12); transform: translateY(-2px); }
.habit-card.checked { border-color: var(--sage); background: rgba(168, 176, 138, 0.04); }
.habit-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; color: #fff; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.habit-card:hover .habit-icon { transform: scale(1.08) rotate(-5deg); }
.hi-sage { background: linear-gradient(135deg, var(--sage), var(--sage-d)); }
.hi-terra { background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); }
.hi-amber { background: linear-gradient(135deg, var(--amber), var(--amber-d)); }
.hi-sky { background: linear-gradient(135deg, var(--sky), var(--sky-d)); }
.hi-rose { background: linear-gradient(135deg, var(--rose), var(--rose-d)); }
.hi-plum { background: linear-gradient(135deg, var(--plum), #8A6B92); }
.habit-info { flex: 1; min-width: 0; }
.habit-name { font-size: 15px; font-weight: 700; color: var(--terra-deep); }
.habit-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; font-size: 12px; color: var(--text-secondary); }
.habit-streak { display: inline-flex; align-items: center; gap: 3px; color: var(--amber-d, #C08A3E); font-weight: 700; }
.habit-week { display: flex; gap: 4px; align-items: center; }
.hw-dot { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; border: 1.5px solid var(--border); color: var(--text-secondary); background: rgba(243, 234, 221, 0.4); cursor: pointer; transition: all 0.2s; }
.hw-dot:hover { border-color: var(--terracotta); }
.hw-dot.done { background: var(--sage); border-color: var(--sage); color: #fff; }
.hw-dot.today-dot { border-color: var(--terracotta); border-width: 2px; }
.hw-dot.future { opacity: 0.4; cursor: default; }
.habit-check { width: 42px; height: 42px; border-radius: 13px; border: 2.5px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; color: transparent; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); flex-shrink: 0; }
.habit-check:hover { border-color: var(--sage); transform: scale(1.1); }
.habit-check.checked { background: var(--sage); border-color: var(--sage); color: #fff; transform: scale(1); }
.habit-actions { display: flex; gap: 2px; flex-shrink: 0; }
.ha-btn { width: 30px; height: 30px; border: none; background: transparent; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px; transition: all 0.2s; }
.ha-btn:hover { background: var(--cream); color: var(--terra-deep); }

/* ===== 热力图 ===== */
.heatmap-section { margin-bottom: 22px; }
.section-title { font-size: 15px; font-weight: 700; color: var(--terra-deep); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.heatmap-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); padding: 18px; box-shadow: 0 6px 20px rgba(160, 120, 90, 0.06); overflow-x: auto; min-height: 100px; }
.heatmap { display: flex; gap: 3px; }
.heatmap-col { display: flex; flex-direction: column; gap: 3px; }
.hm-cell { width: 16px; height: 16px; border-radius: 4px; background: var(--cream); transition: all 0.2s; }
.hm-cell.l1 { background: #C5D9B2; }
.hm-cell.l2 { background: #A8C48A; }
.hm-cell.l3 { background: #8BB066; }
.hm-cell.l4 { background: #6B9B4A; }
.heatmap-legend { display: flex; align-items: center; gap: 6px; margin-top: 10px; justify-content: flex-end; font-size: 11px; color: var(--text-secondary); }
.hm-legend-cell { width: 12px; height: 12px; border-radius: 3px; }
.per-habit-heatmaps { margin-top: 22px; }
.phm-item { margin-bottom: 16px; }

/* ===== 空状态 ===== */
.empty-state { text-align: center; padding: 50px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); }
.empty-icon { font-size: 52px; margin-bottom: 14px; }
.empty-title { font-size: 17px; font-weight: 700; color: var(--terra-deep); margin-bottom: 6px; }
.empty-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }

/* ===== 弹窗表单 ===== */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--terra-deep); margin-bottom: 6px; }
.icon-picker { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-opt { width: 42px; height: 42px; border-radius: 12px; border: 1.5px solid var(--border); background: rgba(243, 234, 221, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s; }
.icon-opt:hover { border-color: var(--terracotta); transform: scale(1.08); }
.icon-opt.active { border-color: var(--terracotta); background: rgba(200, 159, 133, 0.12); box-shadow: 0 2px 8px rgba(200, 159, 133, 0.2); }
.color-picker { display: flex; gap: 8px; }
.color-opt { width: 32px; height: 32px; border-radius: 10px; cursor: pointer; border: 2.5px solid transparent; transition: all 0.2s; }
.color-opt:hover { transform: scale(1.1); }
.color-opt.active { border-color: var(--terra-deep); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
.freq-options { display: flex; gap: 8px; flex-wrap: wrap; }
.freq-opt { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--border); background: rgba(243, 234, 221, 0.4); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-secondary); transition: all 0.25s; }
.freq-opt:hover { border-color: var(--terracotta); }
.freq-opt.active { background: rgba(200, 159, 133, 0.14); border-color: var(--terracotta); color: var(--terra-deep); }
.weekday-picker { display: flex; gap: 6px; margin-top: 8px; }
.wd-opt { width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid var(--border); background: rgba(243, 234, 221, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--text-secondary); transition: all 0.2s; }
.wd-opt:hover { border-color: var(--terracotta); }
.wd-opt.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; }

/* ===== 渐入 ===== */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.reveal.in { opacity: 1; transform: none; }

/* ===== 响应式 ===== */
@media (max-width: 700px) {
  .today-banner { flex-direction: column; align-items: flex-start; }
  .habit-card { flex-wrap: wrap; }
  .habit-week { order: 5; width: 100%; margin-top: 8px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

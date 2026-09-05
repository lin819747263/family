<template>
  <div class="anniversary-page">
    <div class="page-header">
      <div class="header-actions">
        <el-select v-model="filterType" placeholder="全部类型" clearable style="width:130px;" @change="loadList">
          <el-option label="生日" value="birthday" />
          <el-option label="纪念日" value="anniversary" />
          <el-option label="节日" value="holiday" />
          <el-option label="倒数日" value="countdown" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button @click="router.push('/reminder/calendar')">
          <el-icon><Calendar /></el-icon>日历
        </el-button>
        <el-button @click="handleTriggerReminders" :loading="triggering">
          <el-icon><Bell /></el-icon>发送提醒
        </el-button>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>添加纪念日
        </el-button>
      </div>
    </div>

    <!-- 即将到来 -->
    <div v-if="upcoming.length > 0" class="section">
      <div class="section-title">
        <el-icon><AlarmClock /></el-icon>
        <span>即将到来</span>
      </div>
      <div class="upcoming-row">
        <div
          v-for="item in upcoming"
          :key="'u-' + item.id"
          class="upcoming-card"
          :style="{ '--accent': item.color }"
        >
          <div class="uc-days">
            <span class="uc-num">{{ item.daysLeft === 0 ? '今天' : item.daysLeft }}</span>
            <span class="uc-unit" v-if="item.daysLeft > 0">天后</span>
          </div>
          <div class="uc-title">
            {{ item.title }}
            <el-tag v-if="item.type === 'countdown'" size="small" type="warning" effect="plain" round style="margin-left:4px;">倒数</el-tag>
          </div>
          <div class="uc-date">{{ formatDate(item.nextDate) }}</div>
          <div v-if="item.lunarDisplay" class="uc-lunar">{{ item.lunarDisplay }}</div>
        </div>
      </div>
    </div>

    <!-- 全部纪念日 -->
    <div class="section">
      <div class="section-title">
        <el-icon><Calendar /></el-icon>
        <span>全部纪念日</span>
        <el-tag size="small" type="info" effect="plain" style="margin-left:8px;">{{ list.length }}</el-tag>
      </div>

      <div v-if="loading" class="card" style="text-align:center;padding:40px;">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <div v-else-if="list.length === 0" class="empty-card card">
        <el-icon :size="56" color="#cbd5e1"><Calendar /></el-icon>
        <p class="empty-title">还没有纪念日</p>
        <p class="empty-desc">添加生日、结婚纪念日、重要节日等，系统会提前提醒您</p>
        <el-button type="primary" @click="openCreate" style="margin-top:12px;">
          <el-icon><Plus /></el-icon>添加第一个纪念日
        </el-button>
      </div>

      <div v-else class="card-grid">
        <div
          v-for="item in list"
          :key="item.id"
          class="anniv-card card"
          :style="{ '--accent': item.color }"
        >
          <!-- 顶部色条 -->
          <div class="ac-stripe"></div>

          <!-- 头部：图标 + 类型 -->
          <div class="ac-head">
            <div class="ac-icon" :style="{ background: item.color + '18', color: item.color }">
              <el-icon :size="22"><component :is="typeIcon(item.type)" /></el-icon>
            </div>
            <el-tag size="small" :type="typeTagType(item.type)" effect="light" round>
              {{ typeLabel(item.type) }}
            </el-tag>
          </div>

          <!-- 标题 -->
          <div class="ac-title">{{ item.title }}</div>

          <!-- 日期信息 -->
          <div class="ac-date">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatDate(item.date) }}</span>
            <span v-if="item.calendarType === 'lunar'" class="ac-lunar">
              <el-icon :size="12"><Moon /></el-icon>{{ item.lunarDisplay || '农历' }}
            </span>
            <span v-if="item.repeatYearly" class="ac-repeat">每年</span>
            <el-tooltip :content="`提前${item.reminderDays || 3}天提醒`" placement="top">
              <span class="ac-reminder">
                <el-icon :size="12"><Bell /></el-icon>{{ item.reminderDays || 3 }}天
              </span>
            </el-tooltip>
          </div>

          <!-- 倒计时 -->
          <div class="ac-countdown" :class="{ today: item.daysLeft === 0, soon: item.daysLeft > 0 && item.daysLeft <= 7, expired: item.daysLeft < 0 }">
            <template v-if="item.daysLeft < 0">
              <span class="cd-emoji">⏰</span>
              <span>已过期 {{ Math.abs(item.daysLeft) }} 天</span>
            </template>
            <template v-else-if="item.daysLeft === 0">
              <span class="cd-emoji">🎉</span>
              <span>就是今天！</span>
            </template>
            <template v-else>
              <span class="cd-num">{{ item.daysLeft }}</span>
              <span class="cd-unit">天后</span>
            </template>
          </div>

          <!-- 年龄/备注 -->
          <div v-if="item.age !== null && item.type === 'birthday'" class="ac-meta">
            将满 {{ item.age }} 岁
          </div>
          <div v-if="item.note" class="ac-note">{{ item.note }}</div>

          <!-- 操作 -->
          <div class="ac-actions">
            <button class="act-btn" @click="openEdit(item)" title="编辑">
              <el-icon><Edit /></el-icon>
            </button>
            <el-popconfirm title="确定删除此纪念日？" @confirm="handleDelete(item.id)">
              <template #reference>
                <button class="act-btn danger" title="删除">
                  <el-icon><Delete /></el-icon>
                </button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑纪念日' : '添加纪念日'"
      width="480px"
      class="form-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.title" placeholder="如：妈妈生日、结婚纪念日" maxlength="50" />
        </el-form-item>

        <el-form-item label="历法">
          <el-radio-group v-model="form.calendarType" @change="onCalendarTypeChange">
            <el-radio-button value="solar">公历</el-radio-button>
            <el-radio-button value="lunar">农历</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.calendarType === 'solar'" label="日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择公历日期"
            value-format="YYYY-MM-DD"
            style="width:100%;"
            @change="onSolarDateChange"
          />
          <div v-if="lunarPreview" class="lunar-preview">
            <el-icon><Moon /></el-icon> 对应农历：{{ lunarPreview }}
          </div>
        </el-form-item>

        <el-form-item v-else label="农历日期">
          <div class="lunar-picker">
            <el-select v-model="lunarForm.year" placeholder="年" style="width:100px;" @change="onLunarYearChange">
              <el-option v-for="y in lunarYears" :key="y" :label="y + '年'" :value="y" />
            </el-select>
            <el-select v-model="lunarForm.month" placeholder="月" style="width:90px;" @change="onLunarChange">
              <el-option v-for="m in lunarMonths" :key="m.value" :label="m.label" :value="m.value" />
            </el-select>
            <el-select v-model="lunarForm.day" placeholder="日" style="width:90px;" @change="onLunarChange">
              <el-option v-for="d in lunarDays" :key="d" :label="lunarDayNames[d]" :value="d" />
            </el-select>
          </div>
          <div class="lunar-leap-row">
            <el-checkbox v-model="lunarForm.isLeapMonth" @change="onLunarChange">闰月</el-checkbox>
            <span v-if="leapMonthError" class="leap-error">{{ leapMonthError }}</span>
          </div>
          <div v-if="solarPreview" class="solar-preview">
            <el-icon><Sunny /></el-icon> 对应公历：{{ solarPreview }}
          </div>
        </el-form-item>

        <el-form-item label="类型">
          <div class="type-picker">
            <div
              v-for="t in typeOptions"
              :key="t.value"
              class="tp-item"
              :class="{ active: form.type === t.value }"
              :style="{ '--accent': t.color }"
              @click="onTypeChange(t.value, t.color)"
            >
              <el-icon :size="20"><component :is="t.icon" /></el-icon>
              <span>{{ t.label }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="颜色">
          <div class="color-picker">
            <div
              v-for="c in colorOptions"
              :key="c"
              class="cp-dot"
              :class="{ active: form.color === c }"
              :style="{ background: c }"
              @click="form.color = c"
            />
          </div>
        </el-form-item>

        <el-form-item v-if="form.type !== 'countdown'" label="每年重复">
          <el-switch v-model="form.repeatYearly" />
        </el-form-item>
        <el-form-item v-else label="倒数类型">
          <el-tag type="warning" effect="light">一次性倒计时，到期后不再重复</el-tag>
        </el-form-item>

        <el-form-item label="提前提醒">
          <el-input-number v-model="form.reminderDays" :min="0" :max="90" />
          <span style="margin-left:8px;color:#94a3b8;font-size:13px;">天</span>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="可选" maxlength="200" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { anniversaryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const list = ref([])
const upcoming = ref([])
const filterType = ref('')
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const triggering = ref(false)

// ===== 农历相关 =====
const lunarPreview = ref('')
const solarPreview = ref('')
const leapMonthError = ref('')
const lunarForm = ref({ year: dayjs().year(), month: 1, day: 1, isLeapMonth: false })

const lunarYears = computed(() => {
  const current = dayjs().year()
  return Array.from({ length: 101 }, (_, i) => current - 80 + i)
})

const lunarMonths = [
  { value: 1, label: '正月' }, { value: 2, label: '二月' }, { value: 3, label: '三月' },
  { value: 4, label: '四月' }, { value: 5, label: '五月' }, { value: 6, label: '六月' },
  { value: 7, label: '七月' }, { value: 8, label: '八月' }, { value: 9, label: '九月' },
  { value: 10, label: '十月' }, { value: 11, label: '冬月' }, { value: 12, label: '腊月' }
]

const lunarDayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

// 农历每月最多30天，返回简单数字数组
const lunarDays = computed(() => Array.from({ length: 30 }, (_, i) => i + 1))

// ===== 表单 =====
const defaultForm = {
  title: '', date: '', type: 'other', icon: 'Calendar',
  color: '#667eea', calendarType: 'solar', lunarDate: '',
  repeatYearly: true, reminderDays: 3, note: ''
}
const form = ref({ ...defaultForm })

const typeOptions = [
  { value: 'birthday', label: '生日', icon: 'User', color: '#f472b6' },
  { value: 'anniversary', label: '纪念日', icon: 'Star', color: '#667eea' },
  { value: 'holiday', label: '节日', icon: 'Flag', color: '#34d399' },
  { value: 'countdown', label: '倒数日', icon: 'Timer', color: '#f97316' },
  { value: 'other', label: '其他', icon: 'MoreFilled', color: '#fbbf24' }
]

const colorOptions = [
  '#667eea', '#764ba2', '#f472b6', '#ef4444',
  '#f97316', '#fbbf24', '#34d399', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
]

function typeLabel(t) {
  return { birthday: '生日', anniversary: '纪念日', holiday: '节日', countdown: '倒数日', other: '其他' }[t] || t
}

function typeIcon(t) {
  return { birthday: 'User', anniversary: 'Star', holiday: 'Flag', countdown: 'Timer', other: 'MoreFilled' }[t] || 'Calendar'
}

function typeTagType(t) {
  return { birthday: 'danger', anniversary: 'primary', holiday: 'success', countdown: 'warning', other: 'info' }[t] || 'info'
}

function formatDate(d) {
  if (!d) return ''
  return dayjs(d).format('YYYY年M月D日')
}

// ===== 类型切换 =====
function onTypeChange(type, color) {
  form.value.type = type
  form.value.color = color
  if (type === 'countdown') {
    form.value.repeatYearly = false
  }
}

// ===== 农历/公历切换 =====
function onCalendarTypeChange(type) {
  form.value.date = ''
  form.value.lunarDate = ''
  lunarPreview.value = ''
  solarPreview.value = ''
  leapMonthError.value = ''
}

// 公历日期变化时，获取农历预览
async function onSolarDateChange(date) {
  lunarPreview.value = ''
  if (!date) return
  try {
    const res = await anniversaryApi.getLunarInfo({ date })
    lunarPreview.value = res.data.display
  } catch (e) { console.error(e) }
}

// 农历年份变化时，重置闰月状态
function onLunarYearChange() {
  lunarForm.value.isLeapMonth = false
  leapMonthError.value = ''
  onLunarChange()
}

// 农历日期变化时，获取公历对应日期
async function onLunarChange() {
  solarPreview.value = ''
  leapMonthError.value = ''
  const { year, month, day, isLeapMonth } = lunarForm.value
  if (!year || !month || !day) return
  try {
    const res = await anniversaryApi.getSolarDate({
      lunarYear: year,
      lunarMonth: month,
      lunarDay: day,
      isLeapMonth: isLeapMonth ? 'true' : 'false'
    })
    form.value.date = res.data.date
    form.value.lunarDate = res.data.lunarDate
    solarPreview.value = dayjs(res.data.date).format('YYYY年M月D日')
  } catch (err) {
    if (isLeapMonth) {
      leapMonthError.value = `${year}年没有闰${lunarMonths.find(m => m.value === month)?.label || ''}，已自动取消`
      lunarForm.value.isLeapMonth = false
      // 用非闰月重试
      try {
        const res = await anniversaryApi.getSolarDate({
          lunarYear: year,
          lunarMonth: month,
          lunarDay: day,
          isLeapMonth: 'false'
        })
        form.value.date = res.data.date
        form.value.lunarDate = res.data.lunarDate
        solarPreview.value = dayjs(res.data.date).format('YYYY年M月D日')
      } catch {
        ElMessage.warning('无效的农历日期')
      }
    } else {
      ElMessage.warning('无效的农历日期')
    }
  }
}

// ===== 页面逻辑 =====
onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
  loadUpcoming()
})

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily?.id }
    if (filterType.value) params.type = filterType.value
    const res = await anniversaryApi.getList(params)
    list.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadUpcoming() {
  try {
    const res = await anniversaryApi.getUpcoming({ familyId: authStore.currentFamily?.id, days: 30 })
    upcoming.value = res.data.slice(0, 5)
  } catch (e) { console.error(e) }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.value = { ...defaultForm }
  lunarForm.value = { year: dayjs().year(), month: 1, day: 1, isLeapMonth: false }
  lunarPreview.value = ''
  solarPreview.value = ''
  leapMonthError.value = ''
  showDialog.value = true
}

async function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    title: item.title,
    date: item.date,
    type: item.type,
    icon: item.icon || 'Calendar',
    color: item.color || '#667eea',
    calendarType: item.calendarType || 'solar',
    lunarDate: item.lunarDate || '',
    repeatYearly: item.repeatYearly !== false,
    reminderDays: item.reminderDays ?? 3,
    note: item.note || ''
  }
  lunarPreview.value = ''
  solarPreview.value = ''
  leapMonthError.value = ''

  // 编辑农历纪念日时，解析农历表单
  if (item.calendarType === 'lunar' && item.lunarDate) {
    try {
      const lunar = JSON.parse(item.lunarDate)
      lunarForm.value = {
        year: dayjs(item.date).year(),
        month: lunar.month,
        day: lunar.day,
        isLeapMonth: lunar.isLeapMonth || false
      }
      // 获取公历预览
      const res = await anniversaryApi.getSolarDate({
        lunarYear: lunarForm.value.year,
        lunarMonth: lunar.month,
        lunarDay: lunar.day,
        isLeapMonth: lunar.isLeapMonth || false
      })
      solarPreview.value = dayjs(res.data.date).format('YYYY年M月D日')
    } catch (e) { console.error(e) }
  }

  // 编辑公历纪念日时，获取农历预览
  if (item.calendarType !== 'lunar' && item.date) {
    try {
      const res = await anniversaryApi.getLunarInfo({ date: item.date })
      lunarPreview.value = res.data.display
    } catch (e) { console.error(e) }
  }

  showDialog.value = true
}

async function handleTriggerReminders() {
  triggering.value = true
  try {
    const res = await anniversaryApi.triggerReminders({ familyId: authStore.currentFamily?.id })
    if (res.data.reminded > 0) {
      ElMessage.success(`已发送 ${res.data.reminded} 条提醒到通知中心`)
    } else {
      ElMessage.info('暂无需提醒的纪念日')
    }
  } finally { triggering.value = false }
}

async function handleSave() {
  if (!form.value.title) return ElMessage.warning('请输入名称')
  if (!form.value.date) return ElMessage.warning('请选择日期')
  saving.value = true
  try {
    const data = { ...form.value, familyId: authStore.currentFamily?.id }
    if (isEdit.value) {
      await anniversaryApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await anniversaryApi.create(data)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    loadList()
    loadUpcoming()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await anniversaryApi.remove(id)
    ElMessage.success('已删除')
    loadList()
    loadUpcoming()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.anniversary-page {
  animation: pageIn 0.4s ease-out;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 即将到来 */
.section {
  margin-bottom: 28px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 14px;
}

.upcoming-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.upcoming-card {
  flex-shrink: 0;
  width: 140px;
  padding: 18px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.25s;
}
.upcoming-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
}
.upcoming-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.uc-days {
  margin-bottom: 8px;
}
.uc-num {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.uc-unit {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 2px;
}
.uc-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.uc-date {
  font-size: 12px;
  color: #94a3b8;
}

/* 空状态 */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #64748b;
  margin-top: 16px;
}
.empty-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 6px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.anniv-card {
  padding: 0;
  overflow: hidden;
  transition: all 0.25s;
  position: relative;
}
.anniv-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
}

.ac-stripe {
  height: 4px;
  background: var(--accent);
}

.anniv-card > *:not(.ac-stripe) {
  padding-left: 20px;
  padding-right: 20px;
}

.ac-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-bottom: 12px;
}

.ac-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ac-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.ac-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}
.ac-repeat {
  display: inline-block;
  padding: 0 6px;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.ac-reminder {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 4px;
}
.ac-lunar {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* 即将到来卡片的农历显示 */
.uc-lunar {
  font-size: 11px;
  color: #8b5cf6;
  margin-top: 2px;
}

/* 农历选择器 */
.lunar-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}
.lunar-leap-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.leap-error {
  font-size: 12px;
  color: #f59e0b;
}

/* 农历/公历预览 */
.lunar-preview,
.solar-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 13px;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.06);
  padding: 4px 10px;
  border-radius: 8px;
}
.solar-preview {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.06);
}

.ac-countdown {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 10px 16px;
  margin: 0 20px 12px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 14px;
  color: #64748b;
}
.ac-countdown.today {
  background: rgba(52, 211, 153, 0.1);
  color: #10b981;
  font-weight: 600;
}
.ac-countdown.soon {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
}
.ac-countdown.expired {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}
.cd-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.cd-unit {
  font-size: 13px;
}
.cd-emoji {
  font-size: 18px;
  margin-right: 4px;
}

.ac-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 6px;
}
.ac-note {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ac-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 10px 16px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
}

.act-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
}
.act-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}
.act-btn.danger:hover {
  background: #fef2f2;
  color: #f87171;
}

/* 类型选择器 */
.type-picker {
  display: flex;
  gap: 8px;
  width: 100%;
}
.tp-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #64748b;
}
.tp-item:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.tp-item.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--accent);
  font-weight: 600;
}

/* 颜色选择器 */
.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cp-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  border: 3px solid transparent;
}
.cp-dot:hover {
  transform: scale(1.15);
}
.cp-dot.active {
  border-color: #1e293b;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
  transform: scale(1.15);
}

/* 弹窗 */
.form-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
.form-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}
.form-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
}
.form-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .card-grid {
    grid-template-columns: 1fr;
  }
  .upcoming-card {
    width: 120px;
  }
  .form-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 92vw !important;
  }
  .form-dialog :deep(.el-dialog__header) {
    padding: 16px 16px 12px;
  }
  .form-dialog :deep(.el-dialog__body) {
    padding: 12px 16px 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>

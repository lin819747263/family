<template>
  <div class="todo-page">
    <!-- 页面头部 -->
    <div v-if="!embedded" class="page-header">
      <div class="header-actions">
        <el-select v-model="filter" placeholder="全部" clearable style="width:110px;" @change="loadList">
          <el-option label="待完成" value="pending" />
          <el-option label="已过期" value="overdue" />
          <el-option label="已归档" value="archived" />
        </el-select>
        <el-select v-model="filterPriority" placeholder="优先级" clearable style="width:100px;" @change="loadList">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button v-if="stats.completed > 0 && filter !== 'archived'" @click="handleArchiveAll" :loading="archiving">
          <el-icon><FolderChecked /></el-icon>归档已完成
        </el-button>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新建待办</el-button>
      </div>
    </div>

    <!-- 时间筛选标签 -->
    <div class="time-filter">
      <div
        v-for="tab in timeTabs"
        :key="tab.value"
        class="time-tab"
        :class="{ active: timeFilter === tab.value }"
        @click="timeFilter = tab.value; loadList()"
      >
        <el-icon :size="16"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 快速添加 -->
    <div class="quick-add card">
      <el-input
        v-model="quickTitle"
        placeholder="快速添加待办，按回车确认..."
        size="large"
        @keyup.enter="handleQuickAdd"
      >
        <template #prefix><el-icon><Plus /></el-icon></template>
      </el-input>
    </div>

    <!-- 待办列表 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <div v-else-if="list.length === 0" class="empty-card card">
      <el-icon :size="56" color="#E2CDB2"><Finished /></el-icon>
      <p class="empty-title">{{ filter === 'archived' ? '暂无归档' : filter ? '没有匹配的待办' : '暂无待办' }}</p>
      <p class="empty-desc">{{ filter === 'archived' ? '完成的待办会自动归档到这里' : filter ? '试试切换筛选条件' : '在上方输入框快速添加，或点击右上角创建' }}</p>
    </div>
    <div v-else class="todo-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="todo-item card"
        :class="{ completed: item.completed, overdue: item.overdue, archived: item.archived }"
      >
        <!-- 优先级色条 -->
        <div class="ti-priority" :class="item.priority"></div>

        <!-- 完成勾选（归档模式下隐藏） -->
        <button v-if="!item.archived" class="ti-check" :class="{ checked: item.completed }" @click="handleToggle(item)">
          <el-icon v-if="item.completed"><Check /></el-icon>
        </button>
        <div v-else class="ti-archived-icon">
          <el-icon :size="16" color="#A08D7A"><FolderChecked /></el-icon>
        </div>

        <!-- 内容 -->
        <div class="ti-body" @click="openEdit(item)">
          <div class="ti-title" :class="{ 'line-through': item.completed || item.archived }">{{ item.title }}</div>
          <div v-if="item.description" class="ti-desc">{{ item.description }}</div>
          <div class="ti-meta">
            <span v-if="item.dueDate" class="ti-due" :class="{ 'is-overdue': item.overdue }">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(item.dueDate) }}
              <span v-if="item.dueTime">{{ item.dueTime }}</span>
              <span v-if="item.overdue && !item.archived" class="overdue-tag">已过期</span>
            </span>
            <span v-if="item.repeatType && item.repeatType !== 'none'" class="ti-repeat" :title="repeatLabel(item.repeatType)">
              <el-icon><Refresh /></el-icon>
              {{ repeatLabel(item.repeatType) }}
            </span>
            <span v-if="!item.archived" class="ti-priority-label" :class="item.priority">
              {{ priorityLabel(item.priority) }}
            </span>
            <span v-if="item.archived" class="archived-tag">已归档 {{ formatDate(item.archivedAt) }}</span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="ti-actions">
          <!-- 归档模式：恢复按钮 -->
          <el-popconfirm v-if="item.archived" title="恢复此待办？" @confirm="handleUnarchive(item.id)">
            <template #reference>
              <button class="act-btn" title="恢复"><el-icon><RefreshLeft /></el-icon></button>
            </template>
          </el-popconfirm>
          <!-- 正常模式：归档按钮 -->
          <el-popconfirm v-else-if="item.completed" title="归档此待办？" @confirm="handleArchive(item.id)">
            <template #reference>
              <button class="act-btn" title="归档"><el-icon><FolderChecked /></el-icon></button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(item.id)">
            <template #reference>
              <button class="act-btn danger" title="删除"><el-icon><Delete /></el-icon></button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑待办' : '新建待办'"
      width="480px"
      class="warm-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" class="warm-form">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="待办事项" maxlength="200" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选，添加详细说明" maxlength="1000" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio-button value="low">低</el-radio-button>
            <el-radio-button value="medium">中</el-radio-button>
            <el-radio-button value="high">高</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.dueDate"
            type="date"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DD"
            style="width:100%;"
          />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-time-picker
            v-model="form.dueTime"
            placeholder="可选"
            format="HH:mm"
            value-format="HH:mm"
            style="width:100%;"
          />
        </el-form-item>
        <el-form-item label="提前提醒">
          <el-select v-model="form.reminderBefore" style="width:100%;">
            <el-option label="不提醒" :value="0" />
            <el-option label="截止时" :value="1" />
            <el-option label="提前5分钟" :value="5" />
            <el-option label="提前15分钟" :value="15" />
            <el-option label="提前30分钟" :value="30" />
            <el-option label="提前1小时" :value="60" />
            <el-option label="提前1天" :value="1440" />
          </el-select>
        </el-form-item>

        <el-form-item label="重复">
          <el-select v-model="form.repeatType" style="width:100%;" @change="onRepeatTypeChange">
            <el-option label="不重复" value="none" />
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每两周" value="biweekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每年" value="yearly" />
            <el-option label="工作日" value="workdays" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <!-- 自定义重复选项 -->
        <template v-if="form.repeatType === 'custom'">
          <el-form-item label="重复间隔">
            <div class="custom-repeat-row">
              <span class="repeat-label">每</span>
              <el-input-number
                v-model="form.repeatInterval"
                :min="1"
                :max="365"
                controls-position="right"
                style="width: 100px;"
              />
              <el-select v-model="form.repeatUnit" style="width: 100px;">
                <el-option label="天" value="days" />
                <el-option label="周" value="weeks" />
                <el-option label="月" value="months" />
                <el-option label="年" value="years" />
              </el-select>
            </div>
          </el-form-item>

          <!-- 每周重复时选择星期 -->
          <el-form-item v-if="form.repeatUnit === 'weeks'" label="重复日">
            <div class="weekday-picker">
              <div
                v-for="(day, idx) in weekdayOptions"
                :key="idx"
                class="weekday-btn"
                :class="{ active: form.repeatWeekdays.includes(idx) }"
                @click="toggleWeekday(idx)"
              >
                {{ day }}
              </div>
            </div>
          </el-form-item>

          <!-- 每月重复时选择日期 -->
          <el-form-item v-if="form.repeatUnit === 'months'" label="重复日">
            <el-select v-model="form.repeatDayOfMonth" style="width: 100%;">
              <el-option v-for="d in 31" :key="d" :label="`每月${d}日`" :value="d" />
              <el-option label="每月最后一天" :value="-1" />
            </el-select>
          </el-form-item>

          <el-form-item label="结束重复">
            <el-radio-group v-model="form.repeatEndType">
              <el-radio value="never">永不</el-radio>
              <el-radio value="count">指定次数</el-radio>
              <el-radio value="date">指定日期</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.repeatEndType === 'count'" label="重复次数">
            <el-input-number v-model="form.repeatCount" :min="1" :max="999" />
            <span class="repeat-hint">次后停止</span>
          </el-form-item>

          <el-form-item v-if="form.repeatEndType === 'date'" label="结束日期">
            <el-date-picker
              v-model="form.repeatEndDate"
              type="date"
              placeholder="选择结束日期"
              value-format="YYYY-MM-DD"
              style="width:100%;"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted } from 'vue'
import { todoApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Calendar, Timer, List, Refresh } from '@element-plus/icons-vue'

const props = defineProps({ embedded: Boolean })
const emit = defineEmits(['stats-update'])
const authStore = useAuthStore()

const list = ref([])
const loading = ref(false)
const filter = ref('')
const filterPriority = ref('')
const timeFilter = ref('all')
const quickTitle = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)

const archiving = ref(false)
const stats = reactive({ total: 0, pending: 0, completed: 0, archived: 0, overdue: 0, dueToday: 0 })

const timeTabs = computed(() => [
  { value: 'today', label: '今日', icon: 'Calendar', count: stats.dueToday || 0 },
  { value: 'week', label: '近7天', icon: 'Timer', count: 0 },
  { value: 'all', label: '全部', icon: 'List', count: stats.total || 0 }
])

const defaultForm = {
  title: '', description: '', priority: 'medium',
  dueDate: dayjs().format('YYYY-MM-DD'), dueTime: '', reminderBefore: 0,
  repeatType: 'none', repeatInterval: 1, repeatUnit: 'days',
  repeatWeekdays: [], repeatDayOfMonth: 1,
  repeatEndType: 'never', repeatCount: 10, repeatEndDate: ''
}
const form = ref({ ...defaultForm })

// 星期选项
const weekdayOptions = ['日', '一', '二', '三', '四', '五', '六']

// 重复类型变化
function onRepeatTypeChange(val) {
  if (val === 'none') {
    form.value.repeatInterval = 1
    form.value.repeatUnit = 'days'
    form.value.repeatWeekdays = []
    form.value.repeatEndType = 'never'
  } else if (val === 'custom') {
    form.value.repeatInterval = 1
    form.value.repeatUnit = 'days'
  }
}

// 切换星期
function toggleWeekday(idx) {
  const idx_pos = form.value.repeatWeekdays.indexOf(idx)
  if (idx_pos > -1) {
    form.value.repeatWeekdays.splice(idx_pos, 1)
  } else {
    form.value.repeatWeekdays.push(idx)
  }
}

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || p
}

function repeatLabel(type) {
  const labels = {
    daily: '每天',
    weekly: '每周',
    biweekly: '每两周',
    monthly: '每月',
    yearly: '每年',
    workdays: '工作日',
    custom: '自定义'
  }
  return labels[type] || ''
}

function formatDate(d) {
  if (!d) return ''
  return dayjs(d).format('M月D日')
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily?.id }
    if (filter.value) params.filter = filter.value
    if (filterPriority.value) params.priority = filterPriority.value

    // 时间筛选
    const today = dayjs().format('YYYY-MM-DD')
    if (timeFilter.value === 'today') {
      params.dueDate = today
    } else if (timeFilter.value === 'week') {
      params.dueDateFrom = today
      params.dueDateTo = dayjs().add(7, 'day').format('YYYY-MM-DD')
    }

    const res = await todoApi.getList(params)
    list.value = res.data.list
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadStats() {
  try {
    const res = await todoApi.getStats({ familyId: authStore.currentFamily?.id })
    Object.assign(stats, res.data)
    emit('stats-update', res.data)
  } catch (e) { console.error(e) }
}

defineExpose({ openCreate })

async function handleQuickAdd() {
  if (!quickTitle.value.trim()) return
  try {
    await todoApi.create({
      title: quickTitle.value.trim(),
      dueDate: dayjs().format('YYYY-MM-DD'),
      familyId: authStore.currentFamily?.id
    })
    quickTitle.value = ''
    ElMessage.success('添加成功')
    loadList()
    loadStats()
  } catch (e) { console.error(e) }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.value = { ...defaultForm }
  showDialog.value = true
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    title: item.title,
    description: item.description || '',
    priority: item.priority || 'medium',
    dueDate: item.dueDate || '',
    dueTime: item.dueTime || '',
    reminderBefore: item.reminderBefore || 0,
    repeatType: item.repeatType || 'none',
    repeatInterval: item.repeatInterval || 1,
    repeatUnit: item.repeatUnit || 'days',
    repeatWeekdays: item.repeatWeekdays ? (typeof item.repeatWeekdays === 'string' ? JSON.parse(item.repeatWeekdays) : item.repeatWeekdays) : [],
    repeatDayOfMonth: item.repeatDayOfMonth || 1,
    repeatEndType: item.repeatEndType || 'never',
    repeatCount: item.repeatCount || 10,
    repeatEndDate: item.repeatEndDate || ''
  }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    const raw = { ...form.value }
    // 创建时如果没有选日期，默认今天
    if (!isEdit.value && !raw.dueDate) raw.dueDate = dayjs().format('YYYY-MM-DD')
    // 清理空字符串为 null，避免后端校验失败
    const data = {
      title: raw.title,
      description: raw.description || null,
      priority: raw.priority || 'medium',
      dueDate: raw.dueDate || null,
      dueTime: raw.dueTime || null,
      reminderBefore: raw.reminderBefore || 0,
      repeatType: raw.repeatType || 'none',
      repeatInterval: raw.repeatInterval || 1,
      repeatUnit: raw.repeatUnit || 'days',
      repeatWeekdays: raw.repeatWeekdays?.length ? raw.repeatWeekdays : null,
      repeatDayOfMonth: raw.repeatDayOfMonth || 1,
      repeatEndType: raw.repeatEndType || 'never',
      repeatCount: raw.repeatCount || 10,
      repeatEndDate: raw.repeatEndDate || null,
      familyId: authStore.currentFamily?.id
    }
    if (isEdit.value) {
      await todoApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await todoApi.create(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadList()
    loadStats()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleToggle(item) {
  try {
    await todoApi.toggleComplete(item.id)
    // 完成后自动从列表移除（已归档）
    list.value = list.value.filter(i => i.id !== item.id)
    ElMessage.success('已完成并归档')
    loadStats()
  } catch (e) { console.error(e) }
}

async function handleArchive(id) {
  try {
    await todoApi.archive(id)
    list.value = list.value.filter(i => i.id !== id)
    ElMessage.success('已归档')
    loadStats()
  } catch (e) { console.error(e) }
}

async function handleUnarchive(id) {
  try {
    await todoApi.unarchive(id)
    list.value = list.value.filter(i => i.id !== id)
    ElMessage.success('已恢复')
    loadStats()
  } catch (e) { console.error(e) }
}

async function handleArchiveAll() {
  archiving.value = true
  try {
    const res = await todoApi.archiveCompleted({ familyId: authStore.currentFamily?.id })
    ElMessage.success(res.message || '归档完成')
    loadList()
    loadStats()
  } catch (e) { console.error(e) }
  finally { archiving.value = false }
}

async function handleDelete(id) {
  try {
    await todoApi.remove(id)
    ElMessage.success('已删除')
    loadList()
    loadStats()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.todo-page {
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
  margin-bottom: 20px;
}
.page-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 时间筛选标签 - 暖色药丸样式 */
.time-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.time-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: rgba(255, 253, 250, 0.8);
  cursor: pointer;
  transition: all 0.25s;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.time-tab:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.time-tab.active {
  background: var(--terracotta); border-color: var(--terracotta);
  color: #fff; box-shadow: 0 6px 16px rgba(200, 159, 133, 0.35);
}
.tab-count {
  background: var(--apricot); color: var(--terra-deep);
  font-size: 11px; font-weight: 700; padding: 1px 8px;
  border-radius: 999px; min-width: 20px; text-align: center;
}
.time-tab.active .tab-count { background: rgba(255, 255, 255, 0.3); color: #fff; }

/* 快速添加 */
.quick-add {
  margin-bottom: 16px;
  padding: 6px 6px 6px 18px;
  display: flex; align-items: center; gap: 10px;
}
.quick-add :deep(.el-input__wrapper) {
  border: none; background: transparent; box-shadow: none;
  font-size: 15px;
}
.quick-add :deep(.el-input__inner) {
  color: var(--text-primary);
}
.quick-add :deep(.el-input__inner::placeholder) {
  color: var(--text-secondary);
}

/* 空状态 */

/* 待办列表 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px 16px 24px;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}
.todo-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(160, 120, 90, 0.14);
}
.todo-item.completed {
  opacity: 0.65;
}
.todo-item.archived {
  opacity: 0.5;
  background: #FBF6EF;
}
.todo-item.overdue {
  border-left: 3px solid #D99A9A;
}
.ti-archived-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.archived-tag {
  font-size: 11px;
  color: #A08D7A;
  background: #F3EADD;
  padding: 0 6px;
  border-radius: 4px;
}

/* 优先级色条 - 暖色 */
.ti-priority {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 5px; border-radius: 0;
}
.ti-priority.high { background: linear-gradient(180deg, var(--rose), #B06A6A); }
.ti-priority.medium { background: linear-gradient(180deg, var(--amber), #C08A3E); }
.ti-priority.low { background: linear-gradient(180deg, var(--sage), #7E8862); }

/* 完成勾选 - 暖色圆角方块 */
.ti-check {
  width: 24px; height: 24px; border-radius: 9px;
  border: 2px solid var(--wood-light); background: #FFFDF9;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px; transition: all 0.25s; color: transparent;
}
.ti-check:hover { border-color: var(--terracotta); transform: scale(1.1); }
.ti-check.checked { background: var(--sage); border-color: var(--sage); color: #fff; }

/* 内容 */
.ti-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.ti-title {
  font-size: 15px;
  font-weight: 600;
  color: #6B5744;
  line-height: 1.4;
}
.ti-title.line-through {
  text-decoration: line-through;
  color: #A08D7A;
}
.ti-desc {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ti-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  font-size: 12px;
}
/* 标签 - 暖色药丸 */
.ti-due {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 3px 10px; border-radius: 999px;
  background: var(--apricot); color: var(--terra-deep); font-weight: 600;
}
.ti-due.is-overdue {
  background: rgba(217, 154, 154, 0.2); color: #B06A6A;
  animation: pulse-soft 2s ease-in-out infinite;
}
@keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.overdue-tag {
  background: rgba(217, 154, 154, 0.2); color: #B06A6A;
  padding: 0 6px; border-radius: 999px; font-weight: 600;
}
.ti-repeat {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 3px 10px; border-radius: 999px;
  background: rgba(159, 184, 201, 0.2); color: #6E8CA0; font-weight: 600;
}
.ti-priority-label {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 600;
}
.ti-priority-label.high { background: rgba(217, 154, 154, 0.2); color: #B06A6A; }
.ti-priority-label.medium { background: rgba(232, 179, 106, 0.2); color: #C08A3E; }
.ti-priority-label.low { background: rgba(168, 176, 138, 0.2); color: #7E8862; }

/* 操作 */
.ti-actions {
  display: flex; gap: 6px; opacity: 0; transition: opacity 0.25s; flex-shrink: 0;
}
.todo-item:hover .ti-actions { opacity: 1; }
.act-btn {
  width: 30px; height: 30px; border-radius: 9px; border: none;
  background: rgba(200, 159, 133, 0.12); color: var(--terra-deep);
  cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.act-btn:hover { background: rgba(200, 159, 133, 0.28); }
.act-btn.danger:hover { background: rgba(217, 154, 154, 0.3); color: #B06A6A; }

/* 自定义重复选项 */
.custom-repeat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repeat-label {
  font-size: 14px;
  color: #A08D7A;
}

.weekday-picker {
  display: flex;
  gap: 6px;
}

.weekday-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(226,205,178,.7);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #A08D7A;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday-btn:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.weekday-btn.active {
  background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  border-color: transparent; color: #fff;
}

.repeat-hint {
  margin-left: 8px;
  font-size: 13px;
  color: #A08D7A;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .header-actions {
    flex-wrap: wrap;
  }
}
</style>

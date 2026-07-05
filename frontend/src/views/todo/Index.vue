<template>
  <div class="todo-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <div class="page-title">待办清单</div>
        <p class="page-desc">记录待办事项，高效管理家庭事务</p>
      </div>
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

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card" @click="filter = ''; loadList()">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card pending" @click="filter = 'pending'; loadList()">
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-label">待完成</div>
      </div>
      <div class="stat-card overdue" @click="filter = 'overdue'; loadList()">
        <div class="stat-num">{{ stats.overdue }}</div>
        <div class="stat-label">已过期</div>
      </div>
      <div class="stat-card archived" @click="filter = 'archived'; loadList()">
        <div class="stat-num">{{ stats.archived }}</div>
        <div class="stat-label">已归档</div>
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
      <el-icon :size="56" color="#cbd5e1"><Finished /></el-icon>
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
          <el-icon :size="16" color="#94a3b8"><FolderChecked /></el-icon>
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
      class="form-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px">
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
import { ref, reactive, onMounted } from 'vue'
import { todoApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const list = ref([])
const loading = ref(false)
const filter = ref('')
const filterPriority = ref('')
const quickTitle = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)

const archiving = ref(false)
const stats = reactive({ total: 0, pending: 0, completed: 0, archived: 0, overdue: 0, dueToday: 0 })

const defaultForm = {
  title: '', description: '', priority: 'medium',
  dueDate: '', dueTime: '', reminderBefore: 0
}
const form = ref({ ...defaultForm })

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || p
}

function formatDate(d) {
  if (!d) return ''
  return dayjs(d).format('M月D日')
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
  loadStats()
})

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily?.id }
    if (filter.value) params.filter = filter.value
    if (filterPriority.value) params.priority = filterPriority.value
    const res = await todoApi.getList(params)
    list.value = res.data.list
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadStats() {
  try {
    const res = await todoApi.getStats({ familyId: authStore.currentFamily?.id })
    Object.assign(stats, res.data)
  } catch (e) { console.error(e) }
}

async function handleQuickAdd() {
  if (!quickTitle.value.trim()) return
  try {
    await todoApi.create({
      title: quickTitle.value.trim(),
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
    reminderBefore: item.reminderBefore || 0
  }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    const data = { ...form.value, familyId: authStore.currentFamily?.id }
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
  color: #94a3b8;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: #667eea;
  line-height: 1.2;
}
.stat-card.pending .stat-num { color: #f59e0b; }
.stat-card.overdue .stat-num { color: #ef4444; }
.stat-card.done .stat-num { color: #10b981; }
.stat-card.archived .stat-num { color: #94a3b8; }
.stat-label {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 快速添加 */
.quick-add {
  margin-bottom: 16px;
  padding: 12px 16px;
}

/* 卡片 */
.card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
}

/* 待办列表 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.todo-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.todo-item.completed {
  opacity: 0.65;
}
.todo-item.archived {
  opacity: 0.5;
  background: #f8fafc;
}
.todo-item.overdue {
  border-left: 3px solid #ef4444;
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
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0 6px;
  border-radius: 4px;
}

/* 优先级色条 */
.ti-priority {
  width: 4px;
  min-height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
}
.ti-priority.high { background: #ef4444; }
.ti-priority.medium { background: #f59e0b; }
.ti-priority.low { background: #10b981; }

/* 完成勾选 */
.ti-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s;
  color: transparent;
}
.ti-check:hover {
  border-color: #667eea;
}
.ti-check.checked {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}

/* 内容 */
.ti-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.ti-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}
.ti-title.line-through {
  text-decoration: line-through;
  color: #94a3b8;
}
.ti-desc {
  font-size: 13px;
  color: #64748b;
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
.ti-due {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #94a3b8;
}
.ti-due.is-overdue {
  color: #ef4444;
}
.overdue-tag {
  background: #fef2f2;
  color: #ef4444;
  padding: 0 6px;
  border-radius: 4px;
  font-weight: 600;
}
.today-tag {
  background: #fef3c7;
  color: #d97706;
  padding: 0 6px;
  border-radius: 4px;
  font-weight: 600;
}
.soon-tag {
  background: #f0f9ff;
  color: #0284c7;
  padding: 0 6px;
  border-radius: 4px;
}
.ti-priority-label {
  padding: 0 6px;
  border-radius: 4px;
  font-weight: 500;
}
.ti-priority-label.high { background: #fef2f2; color: #ef4444; }
.ti-priority-label.medium { background: #fffbeb; color: #d97706; }
.ti-priority-label.low { background: #ecfdf5; color: #10b981; }

/* 操作 */
.ti-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
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
  .header-actions {
    flex-wrap: wrap;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
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

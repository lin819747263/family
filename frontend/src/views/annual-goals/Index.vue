<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">年度目标</div>
        <p class="page-desc">设定目标，追踪进度，一起成长</p>
      </div>
      <div class="header-actions">
        <el-select v-model="selectedYear" size="small" style="width:100px;" @change="loadData">
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
        <el-select v-model="filterCategory" clearable placeholder="全部分类" size="small" style="width:120px;" @change="loadList">
          <el-option label="健康" value="health" />
          <el-option label="学习" value="study" />
          <el-option label="财务" value="finance" />
          <el-option label="生活" value="life" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增目标</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" v-if="!loading && list.length > 0">
      <div class="mini-stat">
        <span class="ms-num">{{ stats.total }}</span>
        <span class="ms-lbl">全部目标</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num active">{{ stats.active }}</span>
        <span class="ms-lbl">进行中</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num done">{{ stats.completed }}</span>
        <span class="ms-lbl">已完成</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num rate">{{ stats.completionRate }}%</span>
        <span class="ms-lbl">完成率</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 空状态 -->
    <div v-else-if="list.length === 0" class="card empty-card">
      <el-icon :size="56" color="#E2CDB2"><Aim /></el-icon>
      <p class="empty-title">还没有年度目标</p>
      <p class="empty-desc">设定目标，让这一年更有意义</p>
      <el-button type="primary" @click="openCreate" style="margin-top:12px;">
        <el-icon><Plus /></el-icon>创建第一个目标
      </el-button>
    </div>

    <!-- 目标列表 -->
    <div v-else class="goal-grid">
      <div v-for="item in list" :key="item.id" class="goal-card card" :class="[item.status, `category-${item.category}`]">
        <div class="goal-header">
          <div class="goal-tags">
            <el-tag :type="categoryType(item.category)" size="small" effect="plain">{{ categoryLabel(item.category) }}</el-tag>
            <el-tag :type="item.taskType === 'maintain' ? 'info' : 'warning'" size="small" effect="plain">{{ item.taskType === 'maintain' ? '维持' : '精进' }}</el-tag>
          </div>
          <div class="goal-actions">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item)">
              <button class="goal-more"><el-icon><MoreFilled /></el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="item.status === 'active'" command="updateProgress">
                    <el-icon><Edit /></el-icon>更新进度
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.status === 'active'" command="complete">
                    <el-icon><Check /></el-icon>标记完成
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.status === 'active'" command="cancel">
                    <el-icon><Close /></el-icon>取消目标
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.status !== 'active'" command="restore">
                    <el-icon><RefreshLeft /></el-icon>恢复进行
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="goal-body">
          <div class="goal-title">{{ item.title }}</div>
          <div v-if="item.description" class="goal-desc">{{ item.description }}</div>

          <!-- 进度条 -->
          <div class="goal-progress">
            <div class="progress-header">
              <span class="progress-label">年度进度</span>
              <span class="progress-value">{{ item.progress }}%</span>
            </div>
            <el-progress :percentage="item.progress" :status="item.status === 'completed' ? 'success' : ''" :stroke-width="8" />
          </div>

          <!-- 季度进度 -->
          <div class="quarter-progress">
            <div class="quarter-item" :class="{ active: currentQuarter === 1 }">
              <span class="quarter-label">Q1</span>
              <el-progress :percentage="item.q1Progress || 0" :stroke-width="4" :show-text="false" />
              <span class="quarter-value">{{ item.q1Progress || 0 }}%</span>
            </div>
            <div class="quarter-item" :class="{ active: currentQuarter === 2 }">
              <span class="quarter-label">Q2</span>
              <el-progress :percentage="item.q2Progress || 0" :stroke-width="4" :show-text="false" />
              <span class="quarter-value">{{ item.q2Progress || 0 }}%</span>
            </div>
            <div class="quarter-item" :class="{ active: currentQuarter === 3 }">
              <span class="quarter-label">Q3</span>
              <el-progress :percentage="item.q3Progress || 0" :stroke-width="4" :show-text="false" />
              <span class="quarter-value">{{ item.q3Progress || 0 }}%</span>
            </div>
            <div class="quarter-item" :class="{ active: currentQuarter === 4 }">
              <span class="quarter-label">Q4</span>
              <el-progress :percentage="item.q4Progress || 0" :stroke-width="4" :show-text="false" />
              <span class="quarter-value">{{ item.q4Progress || 0 }}%</span>
            </div>
          </div>
        </div>

        <div class="goal-footer">
          <div class="goal-meta">
            <el-avatar :size="20" :src="item.creator?.avatar" class="goal-avatar">{{ (item.creator?.nickname || '?')[0] }}</el-avatar>
            <span class="goal-creator">{{ item.creator?.nickname || '未知' }}</span>
          </div>
          <div v-if="item.status === 'completed' && item.completedAt" class="goal-completed">
            <el-icon><Check /></el-icon> {{ item.completedAt }} 完成
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑目标' : '新增年度目标'" width="520px" destroy-on-close class="form-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="年份">
          <el-select v-model="form.year" style="width:100%;">
            <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标标题">
          <el-input v-model="form.title" placeholder="写下你的目标" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述（可选）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%;">
            <el-option label="健康" value="health" />
            <el-option label="学习" value="study" />
            <el-option label="财务" value="finance" />
            <el-option label="生活" value="life" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-radio-group v-model="form.taskType">
            <el-radio-button value="maintain">维持</el-radio-button>
            <el-radio-button value="improve">精进</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 更新进度弹窗 -->
    <el-dialog v-model="showProgressDialog" title="更新进度" width="500px" destroy-on-close class="form-dialog">
      <el-form :model="progressForm" label-width="80px">
        <el-form-item label="年度进度">
          <el-slider v-model="progressForm.progress" :max="100" show-input />
        </el-form-item>
        <el-divider content-position="left">季度进度</el-divider>
        <div class="quarter-progress-form">
          <el-form-item label="Q1">
            <el-slider v-model="progressForm.q1Progress" :max="100" show-input size="small" />
          </el-form-item>
          <el-form-item label="Q2">
            <el-slider v-model="progressForm.q2Progress" :max="100" show-input size="small" />
          </el-form-item>
          <el-form-item label="Q3">
            <el-slider v-model="progressForm.q3Progress" :max="100" show-input size="small" />
          </el-form-item>
          <el-form-item label="Q4">
            <el-slider v-model="progressForm.q4Progress" :max="100" show-input size="small" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showProgressDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleUpdateProgress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { annualGoalApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const list = ref([])
const loading = ref(false)
const selectedYear = ref(new Date().getFullYear())
const filterCategory = ref('')
const showDialog = ref(false)
const showProgressDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)

const form = reactive({
  year: new Date().getFullYear(),
  title: '',
  description: '',
  category: 'other',
  taskType: 'improve'
})

const progressForm = reactive({
  id: null,
  progress: 0,
  q1Progress: 0,
  q2Progress: 0,
  q3Progress: 0,
  q4Progress: 0
})

const currentQuarter = computed(() => {
  const month = new Date().getMonth()
  return Math.floor(month / 3) + 1
})

const stats = reactive({
  total: 0,
  completed: 0,
  active: 0,
  cancelled: 0,
  completionRate: 0
})

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - 2 + i)
})

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadData()
})

async function loadData() {
  await Promise.all([loadList(), loadStats()])
}

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily.id, year: selectedYear.value }
    if (filterCategory.value) params.category = filterCategory.value
    const res = await annualGoalApi.getList(params)
    list.value = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadStats() {
  try {
    const res = await annualGoalApi.getStats({ familyId: authStore.currentFamily.id, year: selectedYear.value })
    Object.assign(stats, res.data)
  } catch (e) { console.error(e) }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.year = selectedYear.value
  form.title = ''
  form.description = ''
  form.category = 'other'
  form.taskType = 'improve'
  showDialog.value = true
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.year = item.year
  form.title = item.title
  form.description = item.description || ''
  form.category = item.category || 'other'
  form.taskType = item.taskType || 'improve'
  showDialog.value = true
}

async function handleSave() {
  if (!form.title.trim()) return ElMessage.warning('请输入目标标题')
  saving.value = true
  try {
    if (isEdit.value) {
      await annualGoalApi.update(editId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await annualGoalApi.create({ ...form, familyId: authStore.currentFamily.id })
      ElMessage.success('目标创建成功 🎯')
    }
    showDialog.value = false
    loadData()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleUpdateProgress() {
  saving.value = true
  try {
    await annualGoalApi.update(progressForm.id, {
      progress: progressForm.progress,
      q1Progress: progressForm.q1Progress,
      q2Progress: progressForm.q2Progress,
      q3Progress: progressForm.q3Progress,
      q4Progress: progressForm.q4Progress
    })
    ElMessage.success('进度已更新')
    showProgressDialog.value = false
    loadData()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleCommand(cmd, item) {
  if (cmd === 'updateProgress') {
    progressForm.id = item.id
    progressForm.progress = item.progress || 0
    progressForm.q1Progress = item.q1Progress || 0
    progressForm.q2Progress = item.q2Progress || 0
    progressForm.q3Progress = item.q3Progress || 0
    progressForm.q4Progress = item.q4Progress || 0
    showProgressDialog.value = true
  } else if (cmd === 'complete') {
    await annualGoalApi.update(item.id, { status: 'completed' })
    ElMessage.success('🎉 恭喜！目标已完成')
    loadData()
  } else if (cmd === 'cancel') {
    await annualGoalApi.update(item.id, { status: 'cancelled' })
    ElMessage.success('已取消')
    loadData()
  } else if (cmd === 'restore') {
    await annualGoalApi.update(item.id, { status: 'active', completedAt: null })
    ElMessage.success('已恢复')
    loadData()
  } else if (cmd === 'edit') {
    openEdit(item)
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定删除这个目标？', '确认删除', { type: 'warning' })
      await annualGoalApi.remove(item.id)
      ElMessage.success('已删除')
      loadData()
    } catch { /* cancelled */ }
  }
}

function categoryLabel(c) {
  return { health: '健康', study: '学习', finance: '财务', life: '生活', other: '其他' }[c] || '其他'
}
function categoryType(c) {
  return { health: 'success', study: '', finance: 'warning', life: 'info', other: 'info' }[c] || 'info'
}
</script>

<style scoped>
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
  align-items: center;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.mini-stat {
  flex: 1;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.ms-num {
  font-size: 24px;
  font-weight: 700;
  color: #6B5744;
}
.ms-num.active { color: #667eea; }
.ms-num.done { color: #34d399; }
.ms-num.rate { color: #E8B36A; }
.ms-lbl {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 4px;
}

/* 空状态 */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #A08D7A;
  margin-top: 16px;
}
.empty-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 8px;
}

/* 目标网格 */
.goal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.goal-card {
  padding: 0;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}
.goal-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.goal-card.completed {
  opacity: 0.75;
}
.goal-card.completed .goal-title {
  text-decoration: line-through;
  color: #A08D7A;
}
.goal-card.cancelled {
  opacity: 0.5;
}
.goal-card.category-health {
  border-left: 3px solid #34d399;
}
.goal-card.category-study {
  border-left: 3px solid #667eea;
}
.goal-card.category-finance {
  border-left: 3px solid #E8B36A;
}
.goal-card.category-life {
  border-left: 3px solid #06b6d4;
}
.goal-card.category-other {
  border-left: 3px solid #A08D7A;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 0;
}
.goal-tags {
  display: flex;
  gap: 6px;
}
.goal-more {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A08D7A;
  transition: all 0.2s;
}
.goal-more:hover {
  background: #F3EADD;
  color: #A08D7A;
}

.goal-body {
  padding: 12px 16px;
}
.goal-title {
  font-size: 16px;
  font-weight: 600;
  color: #6B5744;
  line-height: 1.4;
}
.goal-desc {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 进度条 */
.goal-progress {
  margin-top: 12px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.progress-label {
  font-size: 12px;
  color: #A08D7A;
}
.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

/* 季度进度 */
.quarter-progress {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F3EADD;
}
.quarter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 6px;
  background: #FBF6EF;
}
.quarter-item.active {
  background: #e0e7ff;
  border: 1px solid #667eea;
}
.quarter-label {
  font-size: 11px;
  font-weight: 600;
  color: #A08D7A;
}
.quarter-value {
  font-size: 10px;
  color: #A08D7A;
}
.quarter-progress-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.goal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #F3EADD;
  background: #fafbfc;
}
.goal-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.goal-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}
.goal-creator {
  font-size: 12px;
  color: #A08D7A;
}
.goal-completed {
  font-size: 12px;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .stats-row {
    gap: 10px;
  }
  .mini-stat {
    padding: 12px;
  }
  .ms-num {
    font-size: 20px;
  }
  .goal-grid {
    grid-template-columns: 1fr;
  }
  .form-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 92vw !important;
  }
}
</style>

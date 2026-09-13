<template>
  <div class="annual-goals">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div>
        <div class="page-title">🎯 年度目标</div>
        <div class="page-sub">设定目标，拆解里程碑，一步步走过去</div>
      </div>
      <div class="head-actions">
        <el-select v-model="currentYear" style="width:110px" @change="loadData">
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
        <button class="btn primary" @click="openCreate">＋ 新建目标</button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stats-row reveal">
      <div class="stat-card"><div class="stat-num">{{ stats.total }}</div><div class="stat-lbl">全部目标</div></div>
      <div class="stat-card"><div class="stat-num accent">{{ stats.active }}</div><div class="stat-lbl">进行中</div></div>
      <div class="stat-card"><div class="stat-num green">{{ stats.completed }}</div><div class="stat-lbl">已完成</div></div>
      <div class="stat-card"><div class="stat-num rose">{{ stats.avgProgress }}%</div><div class="stat-lbl">平均进度</div></div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar reveal">
      <button
        v-for="f in filterOptions"
        :key="f.key"
        class="filter-chip"
        :class="{ active: currentFilter === f.key }"
        @click="currentFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <!-- 目标列表 -->
    <div v-if="loading" class="card" style="text-align:center;padding:48px">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>
    <div v-else-if="filteredGoals.length === 0" class="empty-state reveal">
      <div class="empty-icon">🎯</div>
      <div class="empty-title">还没有年度目标</div>
      <div class="empty-desc">设定目标，让这一年更有意义</div>
      <button class="btn primary" @click="openCreate">＋ 创建第一个目标</button>
    </div>
    <div v-else class="goal-grid">
      <div
        v-for="g in filteredGoals"
        :key="g.id"
        class="goal-card reveal"
        :class="['cat-' + g.category, g.status !== 'active' ? 'status-' + g.status : '']"
        @click="openDetail(g)"
      >
        <div class="gc-header">
          <div class="gc-tags">
            <span class="tag cat">{{ categoryLabel(g.category) }}</span>
            <span v-if="g.status === 'completed'" class="tag status-done">✅ 已完成</span>
            <span v-if="g.status === 'cancelled'" class="tag status-cancel">已取消</span>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, g)" @click.stop>
            <button class="gc-more" @click.stop>⋯</button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">✏️ 编辑</el-dropdown-item>
                <el-dropdown-item v-if="g.status === 'active'" command="complete">✅ 标记完成</el-dropdown-item>
                <el-dropdown-item v-if="g.status === 'active'" command="cancel"><span style="color:var(--rose-d)">取消目标</span></el-dropdown-item>
                <el-dropdown-item v-if="g.status !== 'active'" command="restore">恢复进行</el-dropdown-item>
                <el-dropdown-item command="delete" divided><span style="color:var(--rose-d)">删除</span></el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="gc-body">
          <div class="gc-title">{{ g.title }}</div>
          <div v-if="g.description" class="gc-desc">{{ g.description }}</div>
          <div v-if="g.startDate || g.endDate" class="gc-dates">
            📅 {{ g.startDate || '—' }} → {{ g.endDate || '—' }}
          </div>
        </div>
        <div class="gc-progress">
          <div class="prog-header"><span class="prog-label">年度进度</span><span class="prog-value">{{ g.progress || 0 }}%</span></div>
          <div class="prog-bar"><div class="prog-fill" :style="{ width: (g.progress || 0) + '%' }"></div></div>
        </div>
        <div class="gc-footer">
          <div class="gc-milestones">🏁 里程碑 <b>{{ doneMilestoneCount(g) }}/{{ g.milestones?.length || 0 }}</b></div>
          <div class="gc-creator">
            <div class="gc-creator-avatar">{{ g.creator?.nickname?.[0] || '?' }}</div>
            {{ g.creator?.nickname || '未知' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="isEdit ? '编辑目标' : '新建年度目标'" width="560px" destroy-on-close append-to-body class="warm-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="目标标题">
          <el-input v-model="form.title" placeholder="写下你的目标，比如「跑完 100 公里」" maxlength="100" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述（可选）" maxlength="500" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="🏃 健康" value="health" />
            <el-option label="📚 学习" value="study" />
            <el-option label="💰 财务" value="finance" />
            <el-option label="🏠 生活" value="life" />
            <el-option label="📌 其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="form.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存修改' : '创建目标' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" :title="detailGoal?.title" width="680px" destroy-on-close append-to-body class="warm-dialog">
      <template v-if="detailGoal">
        <div class="detail-head-info">
          <span class="tag cat">{{ categoryLabel(detailGoal.category) }}</span>
          <span v-if="detailGoal.status === 'completed'" class="tag status-done">✅ 已完成</span>
          <span v-if="detailGoal.status === 'cancelled'" class="tag status-cancel">已取消</span>
        </div>
        <div class="detail-dates">📅 {{ detailGoal.startDate || '—' }} → {{ detailGoal.endDate || '—' }}</div>
        <div v-if="detailGoal.description" class="detail-desc">{{ detailGoal.description }}</div>

        <div class="detail-progress">
          <div class="prog-header"><span class="prog-label">年度进度</span><span class="prog-value">{{ detailGoal.progress || 0 }}%</span></div>
          <div class="prog-bar"><div class="prog-fill" :style="{ width: (detailGoal.progress || 0) + '%' }"></div></div>
        </div>

        <!-- 里程碑 -->
        <div class="ms-section">
          <div class="ms-header">
            <div class="ms-title">🏁 里程碑 <span style="font-weight:400;font-size:13px;color:var(--text-secondary)">({{ doneMilestoneCount(detailGoal) }}/{{ detailGoal.milestones?.length || 0 }})</span></div>
            <button class="btn sm primary" @click="showMsForm = true">＋ 添加里程碑</button>
          </div>

          <div v-if="!detailGoal.milestones?.length" class="ms-empty">还没有里程碑，添加几个小目标吧</div>
          <div v-else class="ms-list">
            <div
              v-for="ms in sortedMilestones"
              :key="ms.id"
              class="ms-item"
              :class="{ completed: ms.done }"
            >
              <div class="ms-check" :class="{ done: ms.done }" @click="toggleMilestone(ms)">✓</div>
              <div class="ms-info">
                <div class="ms-name">{{ ms.name }}</div>
                <div class="ms-date" :class="milestoneDateClass(ms)">
                  {{ milestoneDateIcon(ms) }} {{ ms.targetDate || '无日期' }}{{ milestoneDateText(ms) }}
                </div>
              </div>
              <div class="ms-actions">
                <button class="ms-action-btn" @click="editMilestone(ms)" title="编辑">✏️</button>
                <button class="ms-action-btn del" @click="deleteMilestone(ms)" title="删除">🗑</button>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn sm ghost" @click="openEdit(detailGoal)">✏️ 编辑目标</button>
          <template v-if="detailGoal.status === 'active'">
            <button class="btn sm sage" @click="markComplete">✅ 标记完成</button>
            <button class="btn sm danger" @click="cancelGoal">取消目标</button>
          </template>
          <button v-if="detailGoal.status !== 'active'" class="btn sm ghost" @click="restoreGoal">恢复进行</button>
          <button class="btn sm danger" @click="deleteGoal">🗑 删除</button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑里程碑弹窗 -->
    <el-dialog v-model="showMsForm" :title="isMsEdit ? '编辑里程碑' : '添加里程碑'" width="440px" destroy-on-close append-to-body class="warm-dialog">
      <el-form :model="msForm" label-width="80px">
        <el-form-item label="里程碑名称">
          <el-input v-model="msForm.name" placeholder="比如「完成第一章」" maxlength="100" />
        </el-form-item>
        <el-form-item label="目标日期">
          <el-date-picker v-model="msForm.targetDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMsForm = false">取消</el-button>
        <el-button type="primary" :loading="msSaving" @click="handleMsSave">{{ isMsEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { annualGoalApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()

// ===== 状态 =====
const currentYear = ref(dayjs().year())
const currentFilter = ref('all')
const goals = ref([])
const loading = ref(false)
const stats = reactive({ total: 0, active: 0, completed: 0, avgProgress: 0 })

// 表单
const showForm = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const form = reactive({ title: '', description: '', category: 'other', dateRange: null })

// 详情
const showDetail = ref(false)
const detailGoal = ref(null)

// 里程碑
const showMsForm = ref(false)
const isMsEdit = ref(false)
const editingMsId = ref(null)
const msSaving = ref(false)
const msForm = reactive({ name: '', targetDate: null })

// ===== 计算属性 =====
const yearOptions = computed(() => {
  const y = dayjs().year()
  return [y - 2, y - 1, y, y + 1, y + 2]
})

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'health', label: '🏃 健康' },
  { key: 'study', label: '📚 学习' },
  { key: 'finance', label: '💰 财务' },
  { key: 'life', label: '🏠 生活' },
  { key: 'other', label: '📌 其他' }
]

const filteredGoals = computed(() => {
  if (currentFilter.value === 'all') return goals.value
  return goals.value.filter(g => g.category === currentFilter.value)
})

const sortedMilestones = computed(() => {
  if (!detailGoal.value?.milestones) return []
  return [...detailGoal.value.milestones].sort((a, b) => {
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
    if (a.targetDate) return -1
    if (b.targetDate) return 1
    return 0
  })
})

// ===== 工具函数 =====
const CATEGORIES = { health: '🏃 健康', study: '📚 学习', finance: '💰 财务', life: '🏠 生活', other: '📌 其他' }
function categoryLabel(c) { return CATEGORIES[c] || c }
function doneMilestoneCount(g) { return (g.milestones || []).filter(m => m.done).length }

function milestoneDateClass(ms) {
  if (ms.done || !ms.targetDate) return ''
  const today = dayjs().format('YYYY-MM-DD')
  if (ms.targetDate < today) return 'overdue'
  if (dayjs(ms.targetDate).diff(dayjs(), 'day') <= 14) return 'upcoming'
  return ''
}
function milestoneDateIcon(ms) {
  if (ms.done) return '📅'
  if (!ms.targetDate) return '📅'
  const today = dayjs().format('YYYY-MM-DD')
  if (ms.targetDate < today) return '⚠️'
  if (dayjs(ms.targetDate).diff(dayjs(), 'day') <= 14) return '⏰'
  return '📅'
}
function milestoneDateText(ms) {
  if (ms.done || !ms.targetDate) return ''
  const today = dayjs().format('YYYY-MM-DD')
  if (ms.targetDate < today) return ' 已过期'
  return ''
}

// ===== 数据加载 =====
async function loadData() {
  const familyId = authStore.currentFamily?.id
  if (!familyId) return
  loading.value = true
  try {
    const [goalsRes, statsRes] = await Promise.all([
      annualGoalApi.getList({ familyId, year: currentYear.value }),
      annualGoalApi.getStats({ familyId, year: currentYear.value })
    ])
    goals.value = goalsRes.data || []
    Object.assign(stats, statsRes.data || { total: 0, active: 0, completed: 0, avgProgress: 0 })
    nextTick(() => observeReveal())
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(loadData)
watch(() => authStore.currentFamily, (f) => { if (f) loadData() })

// ===== 目标操作 =====
function openCreate() {
  isEdit.value = false; editId.value = null
  form.title = ''; form.description = ''; form.category = 'other'
  form.dateRange = [dayjs().format('YYYY-MM-DD'), `${currentYear.value}-12-31`]
  showForm.value = true
}

function openEdit(g) {
  isEdit.value = true; editId.value = g.id
  form.title = g.title; form.description = g.description || ''; form.category = g.category
  form.dateRange = g.startDate && g.endDate ? [g.startDate, g.endDate] : null
  showForm.value = true
  showDetail.value = false
}

async function handleSave() {
  if (!form.title.trim()) return ElMessage.warning('请输入目标标题')
  saving.value = true
  try {
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      startDate: form.dateRange?.[0] || null,
      endDate: form.dateRange?.[1] || null,
      year: currentYear.value,
      familyId: authStore.currentFamily?.id
    }
    if (isEdit.value) {
      await annualGoalApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await annualGoalApi.create(data)
      ElMessage.success('目标创建成功')
    }
    showForm.value = false
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

function handleCommand(cmd, g) {
  if (cmd === 'edit') openEdit(g)
  else if (cmd === 'complete') completeGoal(g)
  else if (cmd === 'cancel') cancelGoalById(g.id)
  else if (cmd === 'restore') restoreGoalById(g.id)
  else if (cmd === 'delete') deleteGoalById(g.id)
}

async function completeGoal(g) {
  try {
    await annualGoalApi.update(g.id, { status: 'completed' })
    ElMessage.success('已标记完成')
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

async function cancelGoalById(id) {
  try {
    await ElMessageBox.confirm('确定取消此目标？', '提示', { type: 'warning' })
    await annualGoalApi.update(id, { status: 'cancelled' })
    ElMessage.success('已取消')
    loadData()
  } catch {}
}

async function restoreGoalById(id) {
  try {
    await annualGoalApi.update(id, { status: 'active' })
    ElMessage.success('已恢复进行')
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

async function deleteGoalById(id) {
  try {
    await ElMessageBox.confirm('确定删除此目标？此操作不可撤销。', '提示', { type: 'warning' })
    await annualGoalApi.remove(id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

// ===== 详情弹窗 =====
async function openDetail(g) {
  try {
    const res = await annualGoalApi.getOne(g.id)
    detailGoal.value = res.data
    showDetail.value = true
  } catch (e) { ElMessage.error('加载失败') }
}

async function markComplete() {
  try {
    await annualGoalApi.update(detailGoal.value.id, { status: 'completed' })
    ElMessage.success('已标记完成')
    showDetail.value = false
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

async function cancelGoal() {
  try {
    await ElMessageBox.confirm('确定取消此目标？', '提示', { type: 'warning' })
    await annualGoalApi.update(detailGoal.value.id, { status: 'cancelled' })
    ElMessage.success('已取消')
    showDetail.value = false
    loadData()
  } catch {}
}

async function restoreGoal() {
  try {
    await annualGoalApi.update(detailGoal.value.id, { status: 'active' })
    ElMessage.success('已恢复进行')
    showDetail.value = false
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

async function deleteGoal() {
  try {
    await ElMessageBox.confirm('确定删除此目标？此操作不可撤销。', '提示', { type: 'warning' })
    await annualGoalApi.remove(detailGoal.value.id)
    ElMessage.success('已删除')
    showDetail.value = false
    loadData()
  } catch {}
}

// ===== 里程碑操作 =====
function editMilestone(ms) {
  isMsEdit.value = true; editingMsId.value = ms.id
  msForm.name = ms.name; msForm.targetDate = ms.targetDate
  showMsForm.value = true
}

async function handleMsSave() {
  if (!msForm.name.trim()) return ElMessage.warning('请输入里程碑名称')
  msSaving.value = true
  try {
    if (isMsEdit.value) {
      await annualGoalApi.updateMilestone(detailGoal.value.id, editingMsId.value, { name: msForm.name.trim(), targetDate: msForm.targetDate })
    } else {
      await annualGoalApi.addMilestone(detailGoal.value.id, { name: msForm.name.trim(), targetDate: msForm.targetDate })
    }
    ElMessage.success(isMsEdit.value ? '已更新' : '里程碑添加成功')
    showMsForm.value = false
    // 刷新详情
    const res = await annualGoalApi.getOne(detailGoal.value.id)
    detailGoal.value = res.data
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
  finally { msSaving.value = false }
}

async function toggleMilestone(ms) {
  try {
    await annualGoalApi.toggleMilestone(detailGoal.value.id, ms.id)
    const res = await annualGoalApi.getOne(detailGoal.value.id)
    detailGoal.value = res.data
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

async function deleteMilestone(ms) {
  try {
    await annualGoalApi.deleteMilestone(detailGoal.value.id, ms.id)
    ElMessage.success('已删除')
    const res = await annualGoalApi.getOne(detailGoal.value.id)
    detailGoal.value = res.data
    loadData()
  } catch (e) { ElMessage.error('操作失败') }
}

// watch showMsForm to reset form
watch(showMsForm, (v) => {
  if (v && !isMsEdit.value) { msForm.name = ''; msForm.targetDate = null }
})

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
    document.querySelectorAll('.annual-goals .reveal:not(.in)').forEach((el, i) => {
      if (!el.dataset.d) el.dataset.d = (i % 6) * 60
      el.style.transitionDelay = el.dataset.d + 'ms'
      revealIO.observe(el)
    })
  })
}
</script>

<style scoped>
.annual-goals { position: relative; }

/* ===== 页头 ===== */
.page-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
.page-title { font-size: 24px; font-weight: 800; color: var(--terra-deep); }
.page-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.head-actions { display: flex; gap: 8px; align-items: center; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 17px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.3s, box-shadow 0.3s; }
.btn.primary { background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4); }
.btn.ghost { background: rgba(255, 253, 250, 0.85); color: var(--terra-deep); border: 1.5px solid var(--border); }
.btn.sage { background: linear-gradient(135deg, var(--sage), var(--sage-d)); color: #fff; }
.btn.danger { background: linear-gradient(135deg, var(--rose), var(--rose-d)); color: #fff; }
.btn.sm { padding: 7px 13px; font-size: 13px; border-radius: 10px; }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.3); }

/* ===== 统计 ===== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 22px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md, 16px); padding: 18px; text-align: center; box-shadow: 0 4px 16px rgba(160, 120, 90, 0.06); }
.stat-num { font-size: 28px; font-weight: 800; color: var(--terra-deep); }
.stat-num.accent { color: var(--amber-d, #C08A3E); }
.stat-num.green { color: var(--sage-d, #7E8862); }
.stat-num.rose { color: var(--rose-d, #B06A6A); }
.stat-lbl { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

/* ===== 筛选 ===== */
.filter-bar { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.filter-chip { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(255, 253, 250, 0.8); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.filter-chip:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.filter-chip.active { background: rgba(200, 159, 133, 0.14); border-color: var(--terracotta); color: var(--terra-deep); }

/* ===== 目标卡片 ===== */
.goal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.goal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); box-shadow: 0 8px 28px rgba(160, 120, 90, 0.08); overflow: hidden; transition: all 0.3s; cursor: pointer; }
.goal-card:hover { box-shadow: 0 12px 36px rgba(160, 120, 90, 0.14); transform: translateY(-3px); }
.goal-card.cat-health { border-left: 4px solid var(--sage); }
.goal-card.cat-study { border-left: 4px solid var(--terracotta); }
.goal-card.cat-finance { border-left: 4px solid var(--amber); }
.goal-card.cat-life { border-left: 4px solid var(--sky); }
.goal-card.cat-other { border-left: 4px solid var(--plum, #A98BB0); }
.goal-card.status-completed { opacity: 0.7; }
.goal-card.status-cancelled { opacity: 0.45; }

.gc-header { padding: 16px 16px 0; display: flex; justify-content: space-between; align-items: flex-start; }
.gc-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.tag.cat { background: rgba(200, 159, 133, 0.12); color: var(--terra-deep); }
.tag.status-done { background: rgba(168, 176, 138, 0.2); color: var(--sage-d, #7E8862); }
.tag.status-cancel { background: rgba(217, 154, 154, 0.15); color: var(--rose-d, #B06A6A); }
.gc-more { width: 28px; height: 28px; border: none; background: transparent; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 16px; transition: all 0.2s; }
.gc-more:hover { background: var(--cream, #F3EADD); color: var(--terra-deep); }

.gc-body { padding: 12px 16px; }
.gc-title { font-size: 16px; font-weight: 700; color: var(--terra-deep); line-height: 1.4; }
.gc-desc { font-size: 13px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.gc-dates { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

.gc-progress { padding: 0 16px 12px; }
.prog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.prog-label { font-size: 12px; color: var(--text-secondary); }
.prog-value { font-size: 14px; font-weight: 700; color: var(--terra-deep); }
.prog-bar { height: 8px; border-radius: 4px; background: var(--cream, #F3EADD); overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--terracotta), var(--amber)); transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }

.gc-footer { padding: 10px 16px; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; align-items: center; }
.gc-milestones { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
.gc-milestones b { color: var(--terra-deep); font-weight: 700; }
.gc-creator { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
.gc-creator-avatar { width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); color: #fff; font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; }

/* ===== 空状态 ===== */
.empty-state { text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg, 24px); }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--terra-deep); margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }

/* ===== 详情弹窗 ===== */
.detail-head-info { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.detail-dates { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); margin-top: 10px; }
.detail-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-top: 12px; }
.detail-progress { margin-top: 18px; }
.detail-progress .prog-bar { height: 10px; border-radius: 5px; }
.detail-actions { margin-top: 24px; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

/* ===== 里程碑 ===== */
.ms-section { margin-top: 24px; }
.ms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ms-title { font-size: 15px; font-weight: 700; color: var(--terra-deep); display: flex; align-items: center; gap: 8px; }
.ms-list { display: flex; flex-direction: column; gap: 10px; }
.ms-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-sm, 12px); background: rgba(243, 234, 221, 0.4); border: 1px solid var(--border); transition: all 0.25s; }
.ms-item:hover { border-color: var(--terracotta); box-shadow: 0 4px 12px rgba(160, 120, 90, 0.08); }
.ms-item.completed { opacity: 0.65; }
.ms-item.completed .ms-name { text-decoration: line-through; }
.ms-check { width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.25s; font-size: 12px; color: transparent; background: #FFFDF9; }
.ms-check:hover { border-color: var(--terracotta); }
.ms-check.done { background: var(--sage); border-color: var(--sage); color: #fff; }
.ms-info { flex: 1; min-width: 0; }
.ms-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ms-date { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.ms-date.overdue { color: var(--rose-d, #B06A6A); }
.ms-date.upcoming { color: var(--amber-d, #C08A3E); }
.ms-actions { display: flex; gap: 4px; }
.ms-action-btn { width: 26px; height: 26px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 13px; transition: all 0.2s; }
.ms-action-btn:hover { background: var(--cream, #F3EADD); color: var(--terra-deep); }
.ms-action-btn.del:hover { background: rgba(217, 154, 154, 0.15); color: var(--rose-d, #B06A6A); }
.ms-empty { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px; }

/* ===== 渐入 ===== */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.reveal.in { opacity: 1; transform: none; }

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .goal-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .page-title { font-size: 20px; }
}
</style>

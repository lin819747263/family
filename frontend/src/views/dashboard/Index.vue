<template>
  <div class="dashboard">
    <!-- ========== 欢迎栏 ========== -->
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-greeting">{{ greeting }}，{{ authStore.nickname }} 👋</div>
          <div class="hero-date">{{ todayStr }}</div>
          <div v-if="upcomingEvents.length" class="hero-events">
            <span v-for="e in upcomingEvents" :key="e.name + e.date" class="event-pill">
              {{ e.emoji }} {{ e.name }}
              <span class="event-days">{{ e.daysLeft === 0 ? '今天' : e.daysLeft === 1 ? '明天' : e.daysLeft + '天后' }}</span>
            </span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="hero-btn primary" @click="showQuickAdd = true">
            <el-icon><Plus /></el-icon>记一笔
          </button>
          <button class="hero-btn" @click="router.push('/reminder/todo')">
            <el-icon><Finished /></el-icon>待办
          </button>
          <button class="hero-btn" @click="router.push('/album/moments')">
            <el-icon><ChatDotRound /></el-icon>瞬间
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷记账弹窗 -->
    <el-dialog v-model="showQuickAdd" :width="quickAddMode === 'batch' ? '520px' : '440px'" top="10vh" destroy-on-close :lock-scroll="false" append-to-body class="quick-add-dialog">
      <template #header>
        <div class="quick-add-header">
          <span class="quick-add-title">快速记账</span>
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: quickAddMode === 'single' }" @click="quickAddMode = 'single'">
              <el-icon><EditPen /></el-icon>单笔
            </button>
            <button class="mode-btn" :class="{ active: quickAddMode === 'batch' }" @click="quickAddMode = 'batch'">
              <el-icon><Document /></el-icon>批量
            </button>
          </div>
        </div>
      </template>
      <TransactionForm v-if="quickAddMode === 'single'" @success="onTxnSuccess" />
      <BatchTransactionForm v-else @success="onTxnSuccess" />
    </el-dialog>

    <!-- ========== 快捷入口 ========== -->
    <div class="shortcuts-row">
      <div class="shortcut-item" @click="router.push('/accounting')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#667eea,#764ba2);">
          <el-icon :size="20"><Coin /></el-icon>
        </div>
        <span>记账</span>
      </div>
      <div class="shortcut-item" @click="router.push('/album')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#f472b6,#ec4899);">
          <el-icon :size="20"><PictureFilled /></el-icon>
        </div>
        <span>相册</span>
      </div>
      <div class="shortcut-item" @click="router.push('/inventory')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#34d399,#10b981);">
          <el-icon :size="20"><Box /></el-icon>
        </div>
        <span>物品</span>
      </div>
      <div class="shortcut-item" @click="router.push('/reminder/anniversary')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);">
          <el-icon :size="20"><Calendar /></el-icon>
        </div>
        <span>纪念日</span>
      </div>
      <div class="shortcut-item" @click="router.push('/recipe')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#fb923c,#f97316);">
          <el-icon :size="20"><Dish /></el-icon>
        </div>
        <span>菜谱</span>
      </div>
      <div class="shortcut-item" @click="router.push('/member')">
        <div class="sc-icon" style="background:linear-gradient(135deg,#a78bfa,#8b5cf6);">
          <el-icon :size="20"><User /></el-icon>
        </div>
        <span>档案</span>
      </div>
    </div>

    <!-- ========== 待办 + 今日吃什么 ========== -->
    <div class="top-row">
      <!-- 待办 -->
      <div class="card module-card">
        <div class="mc-header">
          <div class="mc-title"><span class="mc-dot" style="background:#667eea;"></span>今日待办</div>
          <el-badge v-if="pendingTodos.length" :value="pendingTodos.length" type="primary" />
        </div>
        <div v-if="pendingTodos.length === 0" class="mc-empty">
          <span class="mc-empty-icon">✅</span>
          <span>今日无待办，享受轻松一天</span>
        </div>
        <div v-else class="mc-list">
          <div v-for="t in pendingTodos.slice(0, 5)" :key="t.id" class="mc-list-item" :class="{ overdue: t.overdue }">
            <button class="todo-check" :class="t.priority" @click="handleToggleTodo(t)">
              <el-icon :size="10"><Check /></el-icon>
            </button>
            <span class="mc-item-text">{{ t.title }}</span>
            <span class="mc-item-tag" :class="{ 'is-overdue': t.overdue }">
              {{ t.overdue ? '已过期' : t.daysLeft === 0 ? '今天' : t.daysLeft + '天后' }}
            </span>
          </div>
        </div>
        <div class="mc-footer" @click="router.push('/reminder/todo')">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 今日吃什么 -->
      <div class="card module-card recipe-module">
        <div class="mc-header">
          <div class="mc-title"><span class="mc-dot" style="background:#f59e0b;"></span>今日吃什么</div>
          <button class="shuffle-btn" @click="shuffleRecipe" :disabled="recipeLoading">
            <el-icon :class="{ 'is-loading': recipeLoading }"><RefreshRight /></el-icon>换一换
          </button>
        </div>
        <div v-if="!todayRecipe" class="mc-empty">
          <span class="mc-empty-icon">🍽️</span>
          <span>还没有菜谱，<el-button link type="primary" size="small" @click="router.push('/recipe')">去添加</el-button></span>
        </div>
        <div v-else class="recipe-body" @click="router.push('/recipe')">
          <div class="recipe-thumb" :class="{ 'no-img': !todayRecipe.image }">
            <img v-if="todayRecipe.image" :src="todayRecipe.image" :alt="todayRecipe.name" />
            <el-icon v-else :size="32" color="#cbd5e1"><Dish /></el-icon>
          </div>
          <div class="recipe-info">
            <div class="recipe-name">{{ todayRecipe.name }}</div>
            <div class="recipe-desc">{{ todayRecipe.description || '暂无描述' }}</div>
            <div class="recipe-tags">
              <el-tag v-if="todayRecipe.difficulty" :type="difficultyType(todayRecipe.difficulty)" size="small" effect="light" round>{{ difficultyLabel(todayRecipe.difficulty) }}</el-tag>
              <span v-if="todayRecipe.cookingTime" class="recipe-meta">⏱ {{ todayRecipe.cookingTime }}分钟</span>
              <span v-if="todayRecipe.servings" class="recipe-meta">👥 {{ todayRecipe.servings }}人份</span>
            </div>
            <div v-if="todayRecipe.ingredients?.length" class="recipe-ing">
              🥘 {{ todayRecipe.ingredients.slice(0, 4).map(i => i.name || i).join('、') }}
              <span v-if="todayRecipe.ingredients.length > 4">等</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 物品概览 ========== -->
    <div class="section" v-if="inventoryStats.totalItems > 0">
      <div class="section-head">
        <div class="section-title">
          <span class="st-dot" style="background:#34d399;"></span>物品概览
        </div>
        <el-button text type="primary" size="small" @click="router.push('/inventory')">
          管理物品 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="inv-stats-row">
        <div class="inv-stat" @click="router.push('/inventory')">
          <span class="inv-num">{{ inventoryStats.totalItems }}</span>
          <span class="inv-lbl">物品总数</span>
        </div>
        <div class="inv-stat" @click="router.push('/inventory')">
          <span class="inv-num warn">{{ inventoryStats.expiringItems || 0 }}</span>
          <span class="inv-lbl">即将过期</span>
        </div>
        <div class="inv-stat" @click="router.push('/inventory/borrows')">
          <span class="inv-num">{{ inventoryStats.borrowedItems || 0 }}</span>
          <span class="inv-lbl">借出中</span>
        </div>
      </div>
    </div>

    <!-- ========== 记账概览 ========== -->
    <div class="section">
      <div class="section-head">
        <div class="section-title">
          <span class="st-dot" style="background:#667eea;"></span>记账概览
        </div>
        <el-button text type="primary" size="small" @click="router.push('/accounting')">
          查看账单 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>

      <!-- 今日记账 -->
      <div class="card txn-card">
        <div class="txn-header">
          <div class="txn-header-left">
            <span class="txn-title">今日记账</span>
            <el-tag size="small" effect="plain" round>{{ todayShort }}</el-tag>
          </div>
          <div v-if="todayTxns.length > 0" class="txn-header-right">
            <span v-if="todayIncome > 0" class="txn-total income">收 +{{ formatMoney(todayIncome) }}</span>
            <span v-if="todayExpense > 0" class="txn-total expense expense-badge">支 -{{ formatMoney(todayExpense) }}</span>
          </div>
        </div>
        <div v-if="todayTxns.length === 0" class="txn-empty">
          <span>📝</span>
          <p>今日暂无记账记录</p>
        </div>
        <div v-else class="txn-list">
          <div v-for="t in todayTxns" :key="t.id" class="txn-item">
            <div class="txn-dot" :class="t.type"></div>
            <div class="txn-body">
              <div class="txn-row">
                <div class="txn-left">
                  <el-tag :type="t.type === 'income' ? 'success' : 'danger'" size="small" effect="light" round>{{ t.type === 'income' ? '收' : '支' }}</el-tag>
                  <span v-if="t.Category" class="txn-cat">{{ t.Category.name }}</span>
                  <span v-if="t.note" class="txn-note">{{ t.note }}</span>
                </div>
                <div class="txn-amount" :class="t.type">{{ t.type === 'income' ? '+' : '-' }}¥{{ parseFloat(t.amount).toFixed(2) }}</div>
              </div>
              <div class="txn-time">{{ formatTime(t.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 精彩瞬间 ========== -->
    <div class="section">
      <div class="section-head">
        <div class="section-title">
          <span class="st-dot" style="background:#ec4899;"></span>精彩瞬间
        </div>
        <div class="section-actions">
          <el-button text type="primary" size="small" @click="router.push('/album')">相册</el-button>
          <el-button text type="primary" size="small" @click="router.push('/album/moments')">全部 <el-icon><ArrowRight /></el-icon></el-button>
        </div>
      </div>

      <div v-if="recentMoments.length === 0" class="card moment-empty">
        <span class="me-icon">📸</span>
        <p>还没有精彩瞬间，去记录吧</p>
      </div>
      <div v-else class="moments-grid">
        <div v-for="m in recentMoments" :key="m.id" class="card moment-card" @click="router.push('/album/moments')">
          <div class="mc-top">
            <el-avatar :size="28" :src="m.author?.avatar" class="mc-av">{{ m.author?.nickname?.[0] || '?' }}</el-avatar>
            <span class="mc-name">{{ m.author?.nickname || '匿名' }}</span>
            <span class="mc-time">{{ formatMomentTime(m.created_at) }}</span>
          </div>
          <div v-if="m.content" class="mc-text">{{ m.content }}</div>
          <div v-if="m.images?.length" class="mc-imgs">
            <div v-for="(img, i) in m.images.slice(0, 3)" :key="i" class="mc-img-item">
              <img :src="img" alt="" />
            </div>
            <div v-if="m.images.length > 3" class="mc-img-more">+{{ m.images.length - 3 }}</div>
          </div>
          <div class="mc-bottom">
            <span v-if="m.location" class="mc-loc">📍 {{ m.location }}</span>
            <span class="mc-stats">
              <span v-if="m.likeCount">❤️ {{ m.likeCount }}</span>
              <span v-if="m.commentCount">💬 {{ m.commentCount }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useAccountingStore } from '@/store/accounting'
import { dashboardApi, todoApi, recipeApi, momentApi } from '@/api'
import { getUpcomingEvents } from '@/utils/holidays'
import TransactionForm from '@/components/accounting/TransactionForm.vue'
import BatchTransactionForm from '@/components/accounting/BatchTransactionForm.vue'
import { ElMessage } from 'element-plus'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const data = ref({ accounting: {}, album: {}, inventory: {}, notifications: [] })
const showQuickAdd = ref(false)
const quickAddMode = ref('single')
const pendingTodos = ref([])
const todayRecipe = ref(null)
const recipeLoading = ref(false)

// 日期显示（避免模板中直接调用 dayjs()）
const todayStr = computed(() => dayjs().format('YYYY年M月D日 dddd'))
const todayShort = computed(() => dayjs().format('MM月DD日'))
const recentMoments = ref([])

function onTxnSuccess() { showQuickAdd.value = false; loadDashboard() }

watch(() => accountingStore.currentBookId, (id) => { if (id) loadDashboard() })
watch(() => authStore.currentFamily, (family) => {
  if (family) { loadDashboard(); loadTodos(); loadRecipe(); loadMoments() }
})

function loadDashboard() {
  if (!authStore.currentFamily) return
  const params = { familyId: authStore.currentFamily.id }
  if (accountingStore.currentBookId) params.bookId = accountingStore.currentBookId
  dashboardApi.getData(params)
    .then(res => { data.value = res.data })
    .catch(() => { /* 仪表盘加载失败，静默处理 */ })
}

async function loadTodos() {
  if (!authStore.currentFamily) return
  try {
    const res = await todoApi.getList({ familyId: authStore.currentFamily.id, filter: 'pending' })
    const today = dayjs().format('YYYY-MM-DD')
    pendingTodos.value = (res.data.list || []).map(t => ({
      ...t,
      overdue: !t.completed && t.dueDate && t.dueDate < today,
      daysLeft: t.dueDate ? dayjs(t.dueDate).diff(dayjs(), 'day') : null
    }))
  } catch (e) { console.error(e) }
}

async function handleToggleTodo(t) {
  try {
    await todoApi.toggleComplete(t.id)
    pendingTodos.value = pendingTodos.value.filter(item => item.id !== t.id)
    ElMessage.success('已完成')
  } catch (e) { console.error(e) }
}

async function loadRecipe() {
  if (!authStore.currentFamily) return
  try {
    const res = await recipeApi.random({ familyId: authStore.currentFamily.id, count: 1 })
    todayRecipe.value = res.data[0] || null
  } catch (e) { console.error(e) }
}

async function shuffleRecipe() {
  recipeLoading.value = true
  await loadRecipe()
  recipeLoading.value = false
}

function difficultyLabel(d) { return { easy: '简单', medium: '中等', hard: '困难' }[d] || d }
function difficultyType(d) { return { easy: 'success', medium: 'warning', hard: 'danger' }[d] || 'info' }

const todayTxns = computed(() => data.value.accounting?.todayTransactions || [])
const todayIncome = computed(() => todayTxns.value.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0))
const todayExpense = computed(() => todayTxns.value.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0))

async function loadMoments() {
  if (!authStore.currentFamily) return
  try {
    const res = await momentApi.getList({ familyId: authStore.currentFamily.id, page: 1, pageSize: 5 })
    recentMoments.value = (res.data.list || []).map(m => {
      if (typeof m.images === 'string') { try { m.images = JSON.parse(m.images) } catch { m.images = [] } }
      if (!Array.isArray(m.images)) m.images = []
      return m
    })
  } catch (e) { console.error(e) }
}

function formatMomentTime(d) {
  if (!d) return ''
  const diff = dayjs().diff(dayjs(d), 'day')
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return diff + '天前'
  return dayjs(d).format('M月D日')
}

const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const upcomingEvents = computed(() => getUpcomingEvents(60).slice(0, 3))
const inventoryStats = computed(() => data.value.inventory || {})

function formatTime(dateStr) { return dateStr ? dayjs(dateStr).format('HH:mm') : '' }

onMounted(async () => {
  try {
    if (!await useFamilyGuard()) return
    loadDashboard(); loadTodos(); loadRecipe(); loadMoments()
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.dashboard { animation: fadeUp 0.5s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* ========== 欢迎栏 ========== */
.hero-section {
  position: relative; border-radius: 20px; overflow: hidden;
  margin-bottom: 24px; padding: 32px;
}
.hero-bg {
  position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f472b6 100%);
  opacity: 0.9;
}
.hero-bg::after {
  content: ''; position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.hero-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.hero-greeting { font-size: 26px; font-weight: 800; color: #fff; }
.hero-date { font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 6px; }
.hero-events { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.event-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
  color: #fff; font-size: 13px; font-weight: 500;
  border: 1px solid rgba(255,255,255,0.3);
}
.event-days { opacity: 0.8; font-size: 12px; }
.hero-actions { display: flex; gap: 10px; }
.hero-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 12px; border: none;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
  background: rgba(255,255,255,0.2); color: #fff;
  backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3);
}
.hero-btn:hover { background: rgba(255,255,255,0.35); transform: translateY(-2px); }
.hero-btn.primary {
  background: #fff; color: #667eea; border-color: transparent;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.hero-btn.primary:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.2); }

/* ========== 快捷入口 ========== */
.shortcuts-row {
  display: flex; gap: 12px; margin-bottom: 24px;
  overflow-x: auto; padding-bottom: 4px;
}
.shortcut-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 14px 18px; border-radius: 16px; cursor: pointer;
  background: #fff; border: 1px solid #f1f5f9;
  transition: all 0.25s; flex-shrink: 0; min-width: 72px;
}
.shortcut-item:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.sc-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.shortcut-item span { font-size: 12px; font-weight: 500; color: #64748b; }

/* ========== 顶部双栏 ========== */
.top-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.module-card { padding: 0; display: flex; flex-direction: column; }
.mc-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 12px; }
.mc-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #1e293b; }
.mc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mc-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 32px 16px; color: #94a3b8; font-size: 13px; flex: 1; }
.mc-empty-icon { font-size: 24px; }
.mc-list { padding: 0 10px; flex: 1; }
.mc-list-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 10px; transition: background 0.2s; }
.mc-list-item:hover { background: #f8fafc; }
.mc-list-item.overdue .mc-item-text { color: #ef4444; }
.todo-check {
  width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: transparent; transition: all 0.2s;
}
.todo-check.high { border-color: #fca5a5; }
.todo-check.medium { border-color: #fcd34d; }
.todo-check.low { border-color: #6ee7b7; }
.todo-check:hover { border-color: #10b981; background: #ecfdf5; color: #10b981; }
.mc-item-text { flex: 1; font-size: 13px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-item-tag { font-size: 11px; color: #94a3b8; flex-shrink: 0; padding: 1px 6px; border-radius: 4px; background: #f1f5f9; }
.mc-item-tag.is-overdue { color: #ef4444; background: #fef2f2; font-weight: 600; }
.mc-footer {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 12px; font-size: 13px; color: #94a3b8; cursor: pointer;
  border-top: 1px solid #f1f5f9; transition: color 0.2s;
}
.mc-footer:hover { color: #667eea; }

/* 今日吃什么 */
.shuffle-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: none; border-radius: 8px;
  background: #fffbeb; color: #d97706; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}
.shuffle-btn:hover { background: #fef3c7; }
.recipe-body { display: flex; gap: 14px; padding: 0 18px 18px; cursor: pointer; flex: 1; }
.recipe-body:hover .recipe-name { color: #667eea; }
.recipe-thumb { width: 100px; height: 100px; border-radius: 14px; overflow: hidden; flex-shrink: 0; }
.recipe-thumb img { width: 100%; height: 100%; object-fit: cover; }
.recipe-thumb.no-img { background: #f8fafc; display: flex; align-items: center; justify-content: center; }
.recipe-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.recipe-name { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; transition: color 0.2s; }
.recipe-desc { font-size: 12px; color: #94a3b8; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recipe-tags { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.recipe-meta { font-size: 11px; color: #94a3b8; }
.recipe-ing { font-size: 11px; color: #94a3b8; }

/* ========== 模块通用 ========== */
.section { margin-bottom: 28px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700; color: #1e293b; }
.st-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.section-actions { display: flex; gap: 4px; }

/* ========== 记账时间轴 ========== */
.card { background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; }
.txn-card { padding: 18px; }
.txn-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.txn-header-left { display: flex; align-items: center; gap: 8px; }
.txn-header-right { display: flex; align-items: center; gap: 12px; }
.txn-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.txn-total { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.txn-total.income { color: #10b981; }
.txn-total.expense { color: #ef4444; }
.txn-total.expense-badge {
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.txn-empty { text-align: center; padding: 28px; }
.txn-empty span { font-size: 28px; }
.txn-empty p { margin-top: 6px; color: #94a3b8; font-size: 13px; }
.txn-list { display: flex; flex-direction: column; }
.txn-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f8fafc; }
.txn-item:last-child { border-bottom: none; }
.txn-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 7px; }
.txn-dot.expense { background: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
.txn-dot.income { background: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,0.12); }
.txn-body { flex: 1; min-width: 0; }
.txn-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.txn-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.txn-cat { font-size: 13px; color: #64748b; }
.txn-note { font-size: 12px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.txn-amount { font-size: 15px; font-weight: 700; flex-shrink: 0; }
.txn-amount.expense { color: #ef4444; }
.txn-amount.income { color: #10b981; }
.txn-time { font-size: 11px; color: #cbd5e1; margin-top: 3px; }

/* ========== 精彩瞬间 ========== */
.moment-empty { text-align: center; padding: 40px; }
.me-icon { font-size: 32px; }
.moment-empty p { margin-top: 8px; color: #94a3b8; font-size: 13px; }
.moments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.moment-card { padding: 16px; cursor: pointer; transition: all 0.25s; }
.moment-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.mc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.mc-av { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 600; font-size: 12px; flex-shrink: 0; }
.mc-name { font-size: 13px; font-weight: 600; color: #334155; flex: 1; }
.mc-time { font-size: 11px; color: #94a3b8; }
.mc-text { font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.mc-imgs { display: flex; gap: 6px; margin-bottom: 10px; }
.mc-img-item { width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
.mc-img-item img { width: 100%; height: 100%; object-fit: cover; }
.mc-img-more { width: 80px; height: 80px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #94a3b8; }
.mc-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #94a3b8; }
.mc-loc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
.mc-stats { display: flex; gap: 10px; }

/* ========== 物品概览 ========== */
.inv-stats-row {
  display: flex; gap: 12px;
}
.inv-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px; border-radius: 14px; background: #f8fafc; cursor: pointer;
  transition: all 0.25s;
}
.inv-stat:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.inv-num { font-size: 24px; font-weight: 800; color: #1e293b; }
.inv-num.warn { color: #f97316; }
.inv-lbl { font-size: 12px; color: #94a3b8; }

/* ========== 弹窗 ========== */
/* 禁用弹窗动画，防止抖动 */
.quick-add-dialog :deep(.el-overlay) { transition: none !important; }
.quick-add-dialog :deep(.el-dialog) { transition: none !important; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
.quick-add-dialog :deep(.el-dialog__header) { padding: 20px 24px 16px; margin: 0; border-bottom: 1px solid #f1f5f9; }
.quick-add-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.quick-add-title { font-size: 17px; font-weight: 600; color: #1e293b; }
.mode-toggle { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 3px; }
.mode-btn { display: flex; align-items: center; gap: 4px; padding: 6px 14px; border: none; border-radius: 8px; background: transparent; font-size: 13px; font-weight: 500; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: #fff; color: #667eea; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.mode-btn:hover:not(.active) { color: #64748b; }
.quick-add-dialog :deep(.el-dialog__body) { padding: 20px 24px 24px; }

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .top-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .hero-section { padding: 24px; }
  .hero-greeting { font-size: 20px; }
  .hero-actions { width: 100%; }
  .hero-btn { flex: 1; justify-content: center; padding: 10px 12px; font-size: 13px; }
  .moments-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .stat-grid { grid-template-columns: 1fr; }
  .shortcuts-row { gap: 8px; }
  .shortcut-item { padding: 10px 14px; min-width: 64px; }
}
</style>

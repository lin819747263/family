<template>
  <div class="dashboard">
    <!-- 背景漂浮柔光 -->
    <div class="ambient">
      <span class="a1"></span>
      <span class="a2"></span>
      <span class="a3"></span>
    </div>

    <!-- ========== Hero 欢迎卡 ========== -->
    <section class="hero reveal">
      <div class="hero-glow"></div>
      <div class="hero-left">
        <div class="hero-greet">{{ greeting }}，{{ authStore.nickname }} {{ greetingEmoji }}</div>
        <div class="hero-date">{{ todayStr }} · 家的第 {{ familyDays }} 天</div>
        <div v-if="upcomingEvents.length" class="hero-events">
          <span v-for="e in upcomingEvents" :key="e.name + e.date" class="pill">
            {{ e.emoji }} <b>{{ e.name }}</b>
            · {{ e.daysLeft === 0 ? '今天' : e.daysLeft === 1 ? '明天' : e.daysLeft + '天后' }}
          </span>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle class="lamp" cx="115" cy="185" r="72" fill="#F5D3A0" opacity="0.5"/>
          <circle class="lamp" cx="115" cy="185" r="46" fill="#F8DFB4" opacity="0.6"/>
          <rect x="230" y="52" width="120" height="150" rx="16" fill="#FBF3E4" stroke="#D9BE9C" stroke-width="4"/>
          <line x1="290" y1="56" x2="290" y2="198" stroke="#D9BE9C" stroke-width="4"/>
          <line x1="234" y1="127" x2="346" y2="127" stroke="#D9BE9C" stroke-width="4"/>
          <circle cx="263" cy="95" r="15" fill="#F3CE8F"/>
          <g class="leaf"><path d="M258 200 q-3 -26 -16 -34 q14 2 19 20 q2 -22 -6 -34 q12 8 12 34 q6 -16 16 -19 q-6 14 -11 33 Z" fill="#A8B08A" opacity="0.9"/></g>
          <path d="M247 198 h26 l-4 24 h-18 Z" fill="#C89F85"/>
          <rect x="60" y="228" width="200" height="10" rx="5" fill="#D9BE9C"/>
          <rect x="78" y="238" width="8" height="52" rx="4" fill="#CBA97F"/>
          <rect x="234" y="238" width="8" height="52" rx="4" fill="#CBA97F"/>
          <rect x="112" y="180" width="7" height="48" rx="3.5" fill="#A08D7A"/>
          <path d="M92 182 q23 -26 47 0 Z" fill="#C89F85"/>
          <ellipse cx="115.5" cy="228" rx="20" ry="5" fill="#A08D7A"/>
          <path d="M178 214 h30 v10 q0 8 -15 8 q-15 0 -15 -8 Z" fill="#E8D5C4" stroke="#C9A983" stroke-width="2.5"/>
          <path class="smoke" d="M186 206 q3 -6 0 -11 M196 206 q3 -6 0 -11" stroke="#D9BE9C" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <ellipse cx="160" cy="298" rx="130" ry="16" fill="#EBD9C0"/>
          <path d="M30 292 v-40 l26 -20 26 20 v40 Z" fill="#DFC7A8"/>
          <rect x="48" y="268" width="14" height="24" rx="3" fill="#B08466"/>
          <circle cx="39" cy="266" r="4.5" fill="#F3CE8F"/>
        </svg>
      </div>
      <div class="hero-actions">
        <button class="hbtn primary" @click="showQuickAdd = true">✏️ 记一笔</button>
        <button class="hbtn ghost" @click="router.push('/reminder/todo')">✅ 待办</button>
        <button class="hbtn ghost" @click="router.push('/album/moments')">💬 瞬间</button>
      </div>
    </section>

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

    <!-- 加载中 -->
    <div v-if="dashboardLoading && !loadError" class="card" style="text-align:center;padding:48px 16px;margin-bottom:24px;">
      <div style="font-size:28px;margin-bottom:10px;">⏳</div>
      <span style="color:var(--text-secondary);font-size:14px;">正在加载家庭数据...</span>
    </div>

    <!-- 加载失败 -->
    <div v-if="loadError" class="card" style="text-align:center;padding:48px 16px;margin-bottom:24px;">
      <div style="font-size:28px;margin-bottom:10px;">😵</div>
      <p style="color:var(--text-primary);font-size:15px;font-weight:600;margin-bottom:6px;">数据加载失败</p>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">网络可能不稳定，请稍后再试</p>
      <button class="hbtn primary" style="margin:0 auto;" @click="retryAll">
        🔄 重新加载
      </button>
    </div>

    <!-- ========== 快捷入口 ========== -->
    <section class="shortcuts">
      <div class="sc reveal" @click="router.push('/accounting')">
        <div class="sc-ico g-terra"><span>🪙</span></div>
        <span>小家账本</span>
      </div>
      <div class="sc reveal" @click="router.push('/reminder')">
        <div class="sc-ico g-amber"><span>🔔</span></div>
        <span>家庭提醒</span>
      </div>
      <div class="sc reveal" @click="router.push('/album')">
        <div class="sc-ico g-rose"><span>📷</span></div>
        <span>点滴日常</span>
      </div>
      <div class="sc reveal" @click="router.push('/inventory')">
        <div class="sc-ico g-sage"><span>📦</span></div>
        <span>物品管理</span>
      </div>
      <div class="sc reveal" @click="router.push('/fun')">
        <div class="sc-ico g-sky"><span>🎡</span></div>
        <span>吃喝玩乐</span>
      </div>
      <div class="sc reveal" @click="router.push('/member')">
        <div class="sc-ico g-plum"><span>🗂</span></div>
        <span>档案</span>
      </div>
    </section>

    <!-- ========== 待办 + 今日吃什么 ========== -->
    <template v-if="!dashboardLoading && !loadError">
    <section class="grid-2">
      <!-- 待办 -->
      <div class="card reveal">
        <div class="card-head">
          <div class="card-title"><span class="cdot" style="background:var(--terracotta);"></span>今日待办</div>
          <div class="card-link" @click="router.push('/reminder/todo')">查看全部 →</div>
        </div>
        <div v-if="pendingTodos.length === 0" class="card-empty">
          <span>✅</span>
          <span>今日无待办，享受轻松一天</span>
        </div>
        <div v-else class="todo-list">
          <div v-for="t in pendingTodos.slice(0, 5)" :key="t.id" class="todo" :class="{ done: t.completed }">
            <button class="check" :class="{ 'prio-high': t.priority === 'high' }" @click="handleToggleTodo(t)">✓</button>
            <span class="todo-txt">{{ t.title }}</span>
            <span class="todo-tag" :class="{ over: t.overdue }">
              {{ t.overdue ? '已过期' : t.daysLeft === 0 ? '今天' : t.daysLeft + '天后' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 今日吃什么 -->
      <div class="card reveal">
        <div class="card-head">
          <div class="card-title"><span class="cdot" style="background:var(--amber);"></span>今日吃什么</div>
          <button class="shuffle" @click="shuffleRecipe" :disabled="recipeLoading">
            <span class="ic" :class="{ spin: recipeLoading }">🔄</span>换一换
          </button>
        </div>
        <div v-if="!todayRecipe" class="card-empty">
          <span>🍽️</span>
          <span>还没有菜谱，<el-button link type="primary" size="small" @click="router.push('/recipe')">去添加</el-button></span>
        </div>
        <div v-else class="recipe" @click="router.push('/recipe')">
          <div class="recipe-thumb" :class="{ 'has-img': todayRecipe.image }">
            <img v-if="todayRecipe.image" :src="todayRecipe.image" :alt="todayRecipe.name" />
            <span v-else>{{ recipeEmoji }}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div class="recipe-name">{{ todayRecipe.name }}</div>
            <div class="recipe-desc">{{ todayRecipe.description || '暂无描述' }}</div>
            <div class="recipe-meta">
              <span v-if="todayRecipe.difficulty" class="chip">{{ difficultyLabel(todayRecipe.difficulty) }}</span>
              <span v-if="todayRecipe.cookingTime" class="chip">⏱ {{ todayRecipe.cookingTime }}分钟</span>
              <span v-if="todayRecipe.servings" class="chip">👥 {{ todayRecipe.servings }}人份</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 物品概览 ========== -->
    <template v-if="inventoryStats.totalItems > 0">
      <div class="section-head reveal">
        <div class="section-title"><span class="st-dot" style="background:var(--sage);"></span>物品概览</div>
        <div class="card-link" @click="router.push('/inventory')">管理物品 →</div>
      </div>
      <section class="stats">
        <div class="stat reveal" @click="router.push('/inventory')">
          <span class="stat-num" :data-count="inventoryStats.totalItems">{{ inventoryStats.totalItems }}</span>
          <span class="stat-lbl">物品总数</span>
          <div class="stat-bar"><i :data-w="Math.min(100, inventoryStats.totalItems / 4) + '%'"></i></div>
        </div>
        <div class="stat reveal" @click="router.push('/inventory')">
          <span class="stat-num warn" :data-count="inventoryStats.expiringItems || 0">{{ inventoryStats.expiringItems || 0 }}</span>
          <span class="stat-lbl">即将过期</span>
          <div class="stat-bar"><i data-w="24%" style="background:linear-gradient(90deg,#E0A6A6,#C8836A);"></i></div>
        </div>
        <div class="stat reveal" @click="router.push('/inventory/borrows')">
          <span class="stat-num" :data-count="inventoryStats.borrowedItems || 0">{{ inventoryStats.borrowedItems || 0 }}</span>
          <span class="stat-lbl">借出中</span>
          <div class="stat-bar"><i data-w="14%" style="background:linear-gradient(90deg,#B3C8D6,#9FB8C9);"></i></div>
        </div>
      </section>
    </template>

    <!-- ========== 记账概览 ========== -->
    <div class="section-head reveal">
      <div class="section-title"><span class="st-dot" style="background:var(--terracotta);"></span>记账概览 · 今日</div>
      <div class="card-link" @click="router.push('/accounting')">查看账单 →</div>
    </div>
    <section class="card txn-card reveal">
      <div class="summary">
        <div class="sum-item">今日收入<b class="in">+{{ formatMoney(todayIncome) }}</b></div>
        <div class="sum-item">今日支出<b class="out">-{{ formatMoney(todayExpense) }}</b></div>
        <div class="sum-item">本月结余<b style="color:var(--terra-deep);">{{ formatMoney(monthBalance) }}</b></div>
      </div>
      <div v-if="todayTxns.length === 0" class="txn-empty">
        <span>📝</span>
        <p>今日暂无记账记录</p>
      </div>
      <div v-else class="txn">
        <div v-for="t in todayTxns" :key="t.id" class="txn-item">
          <div class="txn-ico" :class="t.type === 'income' ? 'g-sage' : 'g-amber'">
            {{ t.type === 'income' ? '💼' : getCategoryIcon(t.Category?.name) }}
          </div>
          <div class="txn-body">
            <div class="txn-cat">{{ t.Category?.name || '未分类' }}</div>
            <div class="txn-note">{{ t.note || (t.type === 'income' ? '收入' : '支出') }}</div>
          </div>
          <div class="txn-amt" :class="t.type">{{ t.type === 'income' ? '+' : '-' }}¥{{ parseFloat(t.amount).toFixed(2) }}</div>
        </div>
      </div>
    </section>

    <!-- ========== 精彩瞬间 ========== -->
    <div class="section-head reveal">
      <div class="section-title"><span class="st-dot" style="background:var(--rose);"></span>精彩瞬间</div>
      <div class="card-link" @click="router.push('/album/moments')">全部瞬间 →</div>
    </div>
    <div v-if="recentMoments.length === 0" class="card moment-empty reveal">
      <span>📸</span>
      <p>还没有精彩瞬间，去记录吧</p>
    </div>
    <section v-else class="moments">
      <div v-for="m in recentMoments" :key="m.id" class="moment reveal" @click="router.push('/album/moments')">
        <div class="moment-img" :class="momentBg(m)">
          <img v-if="m.images?.length" :src="m.images[0]" alt="" class="moment-photo" />
          <span v-else class="moment-emoji">{{ momentEmoji(m) }}</span>
        </div>
        <div class="moment-body">
          <div class="moment-top">
            <div class="m-av" :class="momentAvClass(m)">{{ m.author?.nickname?.[0] || '?' }}</div>
            <span class="m-name">{{ m.author?.nickname || '匿名' }}</span>
            <span class="m-time">{{ formatMomentTime(m.created_at) }}</span>
          </div>
          <div class="moment-text">{{ m.content }}</div>
          <div class="moment-foot">
            <span v-if="m.location">📍 {{ m.location }}</span>
            <span v-if="m.likeCount">❤️ {{ m.likeCount }}</span>
            <span v-if="m.commentCount">💬 {{ m.commentCount }}</span>
          </div>
        </div>
      </div>
    </section>
    </template>

    <!-- 页脚 -->
    <div class="footer">
      🔒 这个空间只属于你们 · 所有回忆都被温柔守护
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const recentMoments = ref([])
const loadError = ref(false)
const dashboardLoading = ref(true)

const todayStr = computed(() => dayjs().format('YYYY年M月D日 · dddd'))
const todayShort = computed(() => dayjs().format('MM月DD日'))

// 家的天数（从注册日算起）
const familyDays = computed(() => {
  const created = authStore.currentFamily?.created_at
  if (!created) return dayjs().diff(dayjs('2023-01-01'), 'day')
  return dayjs().diff(dayjs(created), 'day')
})

// 问候语
const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const greetingEmoji = computed(() => {
  const h = dayjs().hour()
  if (h < 6) return '🌙'
  if (h < 12) return '☀️'
  if (h < 14) return '🌤️'
  if (h < 18) return '🌅'
  return '🌙'
})

const upcomingEvents = computed(() => getUpcomingEvents(60).slice(0, 3))
const inventoryStats = computed(() => data.value.inventory || {})

// 记账数据
const todayTxns = computed(() => data.value.accounting?.todayTransactions || [])
const todayIncome = computed(() => todayTxns.value.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0))
const todayExpense = computed(() => todayTxns.value.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0))
const monthBalance = computed(() => data.value.accounting?.monthBalance || (todayIncome.value - todayExpense.value))

// 菜谱 emoji 映射
const recipeEmoji = computed(() => {
  const name = todayRecipe.value?.name || ''
  if (name.includes('面') || name.includes('粉')) return '🍜'
  if (name.includes('肉') || name.includes('红烧')) return '🥘'
  if (name.includes('沙拉') || name.includes('蔬')) return '🥗'
  if (name.includes('汤') || name.includes('煲') || name.includes('豆腐')) return '🍲'
  if (name.includes('鱼') || name.includes('虾') || name.includes('海鲜')) return '🐟'
  if (name.includes('鸡') || name.includes('鸭')) return '🍗'
  if (name.includes('蛋')) return '🥚'
  if (name.includes('饭') || name.includes('炒')) return '🍛'
  if (name.includes('饼') || name.includes('面包')) return '🥞'
  if (name.includes('甜') || name.includes('蛋糕')) return '🍰'
  return '🍽️'
})

function getCategoryIcon(name) {
  if (!name) return '💰'
  if (name.includes('超市') || name.includes('购物') || name.includes('买')) return '🛒'
  if (name.includes('餐') || name.includes('吃') || name.includes('外卖')) return '🍜'
  if (name.includes('交通') || name.includes('加油') || name.includes('打车')) return '⛽'
  if (name.includes('咖啡') || name.includes('茶') || name.includes('饮')) return '☕'
  if (name.includes('工资') || name.includes('薪')) return '💼'
  if (name.includes('娱乐') || name.includes('电影')) return '🎬'
  if (name.includes('医疗') || name.includes('医')) return '🏥'
  if (name.includes('教育') || name.includes('书')) return '📚'
  return '💰'
}

function momentBg(m) {
  const idx = (m.id || 0) % 3
  return ['m1', 'm2', 'm3'][idx]
}

function momentEmoji(m) {
  const text = (m.content || '').toLowerCase()
  if (text.includes('海') || text.includes('日落') || text.includes('风景')) return '🌅'
  if (text.includes('花') || text.includes('绿') || text.includes('植')) return '🪴'
  if (text.includes('生日') || text.includes('蛋糕') || text.includes('庆祝')) return '🎂'
  if (text.includes('吃') || text.includes('餐') || text.includes('美食')) return '🍜'
  if (text.includes('宝') || text.includes('娃') || text.includes('孩子')) return '👶'
  if (text.includes('宠物') || text.includes('猫') || text.includes('狗')) return '🐱'
  const emojis = ['🌅', '🪴', '🎂', '🍜', '📸', '🎉', '🏖️', '🎄']
  return emojis[(m.id || 0) % emojis.length]
}

function momentAvClass(m) {
  const idx = (m.id || 0) % 3
  return ['g-terra', 'g-sage', 'g-rose'][idx]
}

function difficultyLabel(d) { return { easy: '简单', medium: '中等', hard: '困难' }[d] || d }

function formatMomentTime(d) {
  if (!d) return ''
  const diff = dayjs().diff(dayjs(d), 'day')
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return diff + '天前'
  return dayjs(d).format('M月D日')
}

function onTxnSuccess() { showQuickAdd.value = false; loadDashboard() }

// === 数据加载 ===
watch(() => accountingStore.currentBookId, (id) => { if (id) loadDashboard() })
watch(() => authStore.currentFamily, (family) => {
  if (family) { loadDashboard(); loadTodos(); loadRecipe(); loadMoments() }
})

function loadDashboard() {
  if (!authStore.currentFamily) return
  loadError.value = false
  dashboardLoading.value = true
  const params = { familyId: authStore.currentFamily.id }
  if (accountingStore.currentBookId) params.bookId = accountingStore.currentBookId
  dashboardApi.getData(params)
    .then(res => {
      data.value = res.data
      nextTick(() => observeRevealElements())
    })
    .catch(e => {
      loadError.value = true
      console.error(e)
    })
    .finally(() => { dashboardLoading.value = false })
}

async function loadTodos() {
  if (!authStore.currentFamily) return
  loadError.value = false
  try {
    const res = await todoApi.getList({ familyId: authStore.currentFamily.id, filter: 'pending' })
    const today = dayjs().format('YYYY-MM-DD')
    pendingTodos.value = (res.data.list || []).map(t => ({
      ...t,
      overdue: !t.completed && t.dueDate && t.dueDate < today,
      daysLeft: t.dueDate ? dayjs(t.dueDate).diff(dayjs(), 'day') : null
    }))
  } catch (e) { loadError.value = true; console.error(e) }
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
  loadError.value = false
  try {
    const res = await recipeApi.random({ familyId: authStore.currentFamily.id, count: 1 })
    todayRecipe.value = res.data[0] || null
  } catch (e) { loadError.value = true; console.error(e) }
}

async function shuffleRecipe() {
  recipeLoading.value = true
  await loadRecipe()
  recipeLoading.value = false
}

async function loadMoments() {
  if (!authStore.currentFamily) return
  loadError.value = false
  try {
    const res = await momentApi.getList({ familyId: authStore.currentFamily.id, page: 1, pageSize: 5 })
    recentMoments.value = (res.data.list || []).map(m => {
      if (typeof m.images === 'string') { try { m.images = JSON.parse(m.images) } catch { m.images = [] } }
      if (!Array.isArray(m.images)) m.images = []
      return m
    })
    // 数据加载后重新观察新渲染的 .reveal 元素
    nextTick(() => observeRevealElements())
  } catch (e) { loadError.value = true; console.error(e) }
}

function retryAll() {
  loadDashboard(); loadTodos(); loadRecipe(); loadMoments()
}

// === 滚动渐入动画 ===
let revealObserver = null
let countObserver = null
let barObserver = null

function observeRevealElements() {
  document.querySelectorAll('.reveal:not(.in)').forEach((el, idx) => {
    if (!el.dataset.d) el.dataset.d = (idx % 6) * 70
    revealObserver.observe(el)
  })
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el))
  document.querySelectorAll('.stat-bar i').forEach(el => barObserver.observe(el))
}

function initAnimations() {
  // 滚动渐入
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (e.target.dataset.d || 0) + 'ms'
        e.target.classList.add('in')
        revealObserver.unobserve(e.target)
      }
    })
  }, { threshold: 0.12 })

  // 数字滚动
  countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      const el = e.target
      const target = +el.dataset.count
      if (!target) return
      let cur = 0
      const step = Math.max(1, Math.ceil(target / 40))
      const t = setInterval(() => {
        cur += step
        if (cur >= target) { cur = target; clearInterval(t) }
        el.textContent = cur
      }, 22)
      countObserver.unobserve(el)
    })
  }, { threshold: 0.5 })

  // 进度条
  barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.w
        barObserver.unobserve(e.target)
      }
    })
  }, { threshold: 0.5 })

  nextTick(() => observeRevealElements())
}

onMounted(async () => {
  try {
    if (!await useFamilyGuard()) return
    loadDashboard(); loadTodos(); loadRecipe(); loadMoments()
    initAnimations()
  } catch (e) { console.error(e) }
})

onUnmounted(() => {
  revealObserver?.disconnect()
  countObserver?.disconnect()
  barObserver?.disconnect()
})
</script>

<style scoped>
.dashboard {
  position: relative;
  padding-bottom: 40px;
}

/* ========== 背景柔光 ========== */
.ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.ambient span { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.5; animation: drift 16s ease-in-out infinite alternate; }
.a1 { width: 300px; height: 300px; background: #F2D9B8; top: -80px; left: -60px; }
.a2 { width: 240px; height: 240px; background: #E8C9AE; bottom: -60px; right: -40px; animation-delay: -6s; }
.a3 { width: 200px; height: 200px; background: #DCE6D2; top: 40%; right: 20%; animation-delay: -10s; }
@keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(34px,26px) scale(1.1); } }

/* ========== Hero 欢迎卡 ========== */
.hero {
  position: relative; overflow: hidden; border-radius: var(--radius-lg);
  background: linear-gradient(120deg, #F6E7D3 0%, #EEDCC4 60%, #F0E3D2 100%);
  border: 1px solid var(--border); box-shadow: var(--shadow-lg);
  padding: 30px 34px; display: flex; align-items: center; justify-content: space-between; gap: 24px;
  margin-bottom: 24px;
}
.hero-glow {
  position: absolute; width: 280px; height: 280px; border-radius: 50%;
  background: var(--glow); filter: blur(60px); top: -120px; right: -40px;
  animation: breathe 5s ease-in-out infinite;
}
@keyframes breathe { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.12); } }
.hero-left { position: relative; z-index: 2; }
.hero-greet { font-size: 27px; font-weight: 700; letter-spacing: 0.02em; color: var(--terra-deep); }
.hero-date { margin-top: 6px; font-size: 14px; color: var(--text-secondary); letter-spacing: 0.04em; }
.hero-events { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 999px;
  background: rgba(255, 253, 250, 0.75); border: 1px solid var(--border); font-size: 13px; color: var(--text-primary);
  backdrop-filter: blur(6px); transition: transform 0.3s, box-shadow 0.3s; cursor: default;
}
.pill:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(176, 132, 102, 0.16); }
.pill b { color: var(--terra-deep); font-weight: 600; }
.hero-actions { position: relative; z-index: 2; display: flex; gap: 10px; flex-shrink: 0; }
.hbtn {
  display: flex; align-items: center; gap: 7px; padding: 12px 20px; border-radius: 14px;
  border: none; cursor: pointer; font-size: 14px; font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}
.hbtn.primary {
  background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2;
  box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4);
}
.hbtn.ghost { background: rgba(255, 253, 250, 0.8); color: var(--terra-deep); border: 1.5px solid var(--border); }
.hbtn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.34); }
.hbtn:active { transform: translateY(-1px) scale(0.98); }

/* hero SVG 插画 */
.hero-art { position: relative; z-index: 2; flex-shrink: 0; }
.hero-art svg { width: 150px; height: auto; display: block; }
.lamp { animation: breathe 3.6s ease-in-out infinite; transform-origin: center; }
.leaf { animation: sway 5s ease-in-out infinite; transform-origin: bottom center; }
@keyframes sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
.smoke { animation: rise-smoke 4s ease-in-out infinite; }
@keyframes rise-smoke { 0% { opacity: 0; transform: translateY(6px) scale(0.9); } 40% { opacity: 0.7; } 100% { opacity: 0; transform: translateY(-14px) scale(1.15); } }

/* ========== 快捷入口 ========== */
.shortcuts { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; }
.sc {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
  padding: 18px 8px; text-align: center; cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s, border-color 0.35s;
  box-shadow: var(--shadow-sm);
}
.sc:hover { transform: translateY(-6px); box-shadow: 0 16px 34px rgba(160, 120, 90, 0.16); border-color: var(--terracotta); }
.sc-ico {
  width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  font-size: 23px; color: #fff; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sc:hover .sc-ico { transform: scale(1.12) rotate(-6deg); }
.sc span { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.g-terra { background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); }
.g-rose { background: linear-gradient(135deg, #E0A6A6, var(--rose)); }
.g-sage { background: linear-gradient(135deg, #B7C097, var(--sage)); }
.g-amber { background: linear-gradient(135deg, #F0C684, var(--amber)); }
.g-sky { background: linear-gradient(135deg, #B3C8D6, var(--sky)); }
.g-plum { background: linear-gradient(135deg, #C3A6C9, #A98BB0); }

/* ========== 卡片通用 ========== */
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 12px; margin: -20px -20px 0; }
.card-title { display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.cdot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.card-link { font-size: 13px; color: var(--terracotta-d); cursor: pointer; display: flex; align-items: center; gap: 3px; transition: gap 0.25s, color 0.25s; }
.card-link:hover { gap: 7px; color: var(--terra-deep); }
.card-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 32px 16px; color: var(--text-secondary); font-size: 13px; }

.grid-2 { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-bottom: 24px; }

/* ========== 待办 ========== */
.todo-list { padding: 4px 0 10px; }
.todo {
  display: flex; align-items: center; gap: 12px; padding: 12px 0;
  border-bottom: 1px dashed rgba(226, 205, 178, 0.6); transition: opacity 0.3s, transform 0.3s;
}
.todo:last-child { border-bottom: none; }
.check {
  width: 22px; height: 22px; border-radius: 8px; border: 2px solid var(--wood-light);
  background: #FFFDF9; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: transparent; transition: all 0.25s;
}
.check:hover { border-color: var(--terracotta); transform: scale(1.08); }
.todo.done .check { background: var(--sage); border-color: var(--sage); color: #fff; }
.todo-txt { flex: 1; font-size: 14.5px; color: var(--text-primary); transition: all 0.3s; }
.todo.done .todo-txt { text-decoration: line-through; color: var(--text-secondary); opacity: 0.6; }
.todo-tag { font-size: 12px; padding: 3px 10px; border-radius: 999px; background: rgba(232, 179, 106, 0.16); color: var(--terra-deep); font-weight: 600; flex-shrink: 0; }
.todo-tag.over { background: rgba(217, 154, 154, 0.18); color: #B06A6A; }
.prio-high { border-color: var(--rose); }

/* ========== 今日吃什么 ========== */
.recipe { display: flex; gap: 16px; align-items: center; cursor: pointer; padding: 4px 0 6px; }
.recipe:hover .recipe-name { color: var(--terra-deep); }
.recipe-thumb {
  width: 96px; height: 96px; border-radius: var(--radius-md); flex-shrink: 0;
  background: linear-gradient(135deg, #F0DCC0, #E4CBA8);
  display: flex; align-items: center; justify-content: center; font-size: 40px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
.recipe-thumb.has-img { background: none; }
.recipe-thumb img { width: 100%; height: 100%; object-fit: cover; }
.recipe:hover .recipe-thumb { transform: rotate(-4deg) scale(1.05); }
.recipe-name { font-size: 18px; font-weight: 700; color: var(--text-primary); transition: color 0.2s; }
.recipe-desc { font-size: 13px; color: var(--text-secondary); margin: 5px 0 9px; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recipe-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--terra-deep); }
.chip { padding: 3px 10px; border-radius: 999px; background: rgba(168, 176, 138, 0.16); }
.shuffle {
  margin-left: auto; background: rgba(200, 159, 133, 0.12); border: none; color: var(--terra-deep);
  padding: 7px 13px; border-radius: 10px; font-size: 12.5px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all 0.3s; flex-shrink: 0;
}
.shuffle:hover { background: rgba(200, 159, 133, 0.24); }
.shuffle .ic { display: inline-block; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.shuffle .spin { transform: rotate(360deg); }

/* ========== 概览区 ========== */
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-title { display: flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 700; color: var(--text-primary); }
.st-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
.stat {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px;
  display: flex; flex-direction: column; gap: 6px; cursor: pointer;
  transition: transform 0.35s, box-shadow 0.35s; box-shadow: var(--shadow-sm);
}
.stat:hover { transform: translateY(-5px); box-shadow: 0 16px 34px rgba(160, 120, 90, 0.15); }
.stat-num { font-size: 30px; font-weight: 800; color: var(--terra-deep); letter-spacing: -0.02em; }
.stat-num.warn { color: #C88A6A; }
.stat-lbl { font-size: 13px; color: var(--text-secondary); }
.stat-bar { height: 6px; border-radius: 3px; background: var(--apricot); margin-top: 8px; overflow: hidden; }
.stat-bar i {
  display: block; height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--terracotta), var(--amber));
  width: 0; transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ========== 记账概览 ========== */
.txn-card { padding: 0; overflow: hidden; }
.summary {
  display: flex; gap: 20px; padding: 14px 22px;
  background: rgba(243, 234, 221, 0.5); border-bottom: 1px solid var(--border);
}
.sum-item { font-size: 13px; color: var(--text-secondary); }
.sum-item b { display: block; font-size: 19px; margin-top: 3px; }
.sum-item b.in { color: var(--sage); }
.sum-item b.out { color: #C8836A; }
.txn-empty { text-align: center; padding: 28px; }
.txn-empty span { font-size: 28px; }
.txn-empty p { margin-top: 6px; color: var(--text-secondary); font-size: 13px; }
.txn { padding: 6px 22px 16px; }
.txn-item { display: flex; align-items: center; gap: 13px; padding: 13px 0; border-bottom: 1px dashed rgba(226, 205, 178, 0.6); transition: background 0.3s; }
.txn-item:last-child { border-bottom: none; }
.txn-ico { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
.txn-body { flex: 1; min-width: 0; }
.txn-cat { font-size: 14.5px; font-weight: 600; color: var(--text-primary); }
.txn-note { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.txn-amt { font-size: 16px; font-weight: 700; }
.txn-amt.out { color: #C8836A; }
.txn-amt.in { color: var(--sage); }

/* ========== 精彩瞬间 ========== */
.moment-empty { text-align: center; padding: 40px; }
.moment-empty span { font-size: 32px; display: block; }
.moment-empty p { margin-top: 8px; color: var(--text-secondary); font-size: 13px; }
.moments { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
.moment {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
  overflow: hidden; cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
  box-shadow: var(--shadow-sm);
}
.moment:hover { transform: translateY(-6px) rotate(-0.6deg); box-shadow: 0 20px 40px rgba(160, 120, 90, 0.18); }
.moment-img { height: 130px; display: flex; align-items: center; justify-content: center; font-size: 44px; overflow: hidden; position: relative; }
.moment-photo { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.moment:hover .moment-photo { transform: scale(1.06); }
.moment-emoji { font-size: 44px; }
.m1 { background: linear-gradient(135deg, #F2DCC0, #E7C9A6); }
.m2 { background: linear-gradient(135deg, #DDE6D2, #C6D2B6); }
.m3 { background: linear-gradient(135deg, #F3DCDC, #E7C3C3); }
.moment-body { padding: 14px 16px; }
.moment-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.m-av { width: 26px; height: 26px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 600; }
.m-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.m-time { margin-left: auto; font-size: 11px; color: var(--text-secondary); }
.moment-text { font-size: 13.5px; line-height: 1.6; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.moment-foot { display: flex; gap: 14px; margin-top: 11px; font-size: 12px; color: var(--text-secondary); }
.moment-foot span { transition: transform 0.25s; cursor: pointer; }
.moment-foot span:hover { transform: scale(1.18); }

/* ========== 页脚 ========== */
.footer {
  text-align: center; margin-top: 48px; font-size: 12px; color: #BCAB97;
  letter-spacing: 0.08em; line-height: 1.9;
}

/* ========== 弹窗 ========== */
.quick-add-dialog :deep(.el-overlay) { transition: none !important; }
.quick-add-dialog :deep(.el-dialog) { transition: none !important; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
.quick-add-dialog :deep(.el-dialog__header) { padding: 20px 24px 16px; margin: 0; border-bottom: 1px solid var(--border); }
.quick-add-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.quick-add-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.mode-toggle { display: flex; gap: 4px; background: var(--apricot); border-radius: 10px; padding: 3px; }
.mode-btn { display: flex; align-items: center; gap: 4px; padding: 6px 14px; border: none; border-radius: 8px; background: transparent; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: #fff; color: var(--terra-deep); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.mode-btn:hover:not(.active) { color: var(--text-primary); }
.quick-add-dialog :deep(.el-dialog__body) { padding: 20px 24px 24px; }

/* ========== 响应式 ========== */
@media (max-width: 960px) {
  .shortcuts { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: 1fr; }
  .moments { grid-template-columns: repeat(2, 1fr); }
  .hero-art { display: none; }
  .ambient { display: none; }
}
@media (max-width: 768px) {
  .hero { padding: 22px; flex-direction: column; align-items: flex-start; }
  .hero-greet { font-size: 22px; }
  .hero-actions { width: 100%; flex-wrap: wrap; }
  .hbtn { flex: 1; justify-content: center; }
  .shortcuts { gap: 10px; }
  .stats { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .stat { padding: 14px; }
  .stat-num { font-size: 24px; }
  .recipe { flex-direction: column; text-align: center; }
  .shuffle { margin: 0 auto; }
  .card-head { padding: 14px 16px 10px; margin: -16px -16px 0; }
  .summary { gap: 12px; padding: 12px 16px; }
  .sum-item { font-size: 12px; }
  .sum-item b { font-size: 16px; }
  .txn { padding: 4px 16px 12px; }
}
@media (max-width: 480px) {
  .shortcuts { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .sc { padding: 14px 6px; }
  .sc-ico { width: 40px; height: 40px; font-size: 20px; }
  .stats, .moments { grid-template-columns: 1fr; }
  .grid-2 { gap: 14px; }
}
</style>

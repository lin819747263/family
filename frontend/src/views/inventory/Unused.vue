<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-head">
      <div>
        <div class="page-title">📦 物品管理</div>
        <div class="page-sub">家里的每件东西，都有属于自己的位置</div>
      </div>
      <div class="head-actions">
        <el-button class="btn-ghost">
          <span>🪄</span> AI 录入
        </el-button>
        <el-button class="btn-primary">
          <span>＋</span> 添加物品
        </el-button>
      </div>
    </div>

    <!-- 子标签页 -->
    <div class="subtabs">
      <router-link to="/inventory" class="subtab">🗃 物品总览</router-link>
      <router-link to="/inventory/spaces" class="subtab">🏠 空间管理</router-link>
      <router-link to="/inventory/borrows" class="subtab">🤝 借物追踪</router-link>
      <router-link to="/inventory/unused" class="subtab" :class="{ active: $route.path === '/inventory/unused' }">🍃 断舍离</router-link>
    </div>

    <!-- 月份选择 -->
    <div class="filter-bar reveal">
      <span class="months-label">超过</span>
      <button
        class="m-chip"
        :class="{ active: months === 6 }"
        @click="months = 6; loadItems()"
      >6个月</button>
      <button
        class="m-chip"
        :class="{ active: months === 12 }"
        @click="months = 12; loadItems()"
      >12个月</button>
      <button
        class="m-chip"
        :class="{ active: months === 24 }"
        @click="months = 24; loadItems()"
      >24个月</button>
      <span class="months-label">未使用</span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="card empty-card">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="card error-card">
      <el-icon :size="48" color="#f87171"><CircleCloseFilled /></el-icon>
      <p>数据加载失败，请稍后重试</p>
      <el-button class="btn-primary" style="margin-top:12px;" @click="loadItems">
        🔄 重新加载
      </el-button>
    </div>

    <!-- 汇总卡片 -->
    <div v-else-if="items.length > 0" class="card summary-card reveal">
      <div class="summary-ico">🍃</div>
      <div class="summary-text">
        发现 <b>{{ items.length }} 件</b> 长期闲置物品，合计价值约 <b>¥{{ totalValue.toLocaleString() }}</b>。
        让它们去需要的地方，给家一点呼吸的空间。
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="card empty-card">
      <el-icon :size="48" color="#67C23A"><Check /></el-icon>
      <p>没有发现长期未使用的物品，继续保持！</p>
    </div>

    <!-- 闲置物品网格 -->
    <div v-else class="unused-grid">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="card unused-card reveal"
        :style="{ animationDelay: (idx % 6) * 60 + 'ms' }"
      >
        <span class="unused-badge">闲置 {{ getUnusedMonths(item) }} 个月</span>
        <div class="un-ico" :style="{ background: getItemColor(item.category) }">
          {{ getItemEmoji(item.category) }}
        </div>
        <div class="un-name">{{ item.name }}</div>
        <div class="un-meta">
          📍 {{ item.Space?.name || '-' }}<br>
          💰 购入 ¥{{ item.price ? parseFloat(item.price).toLocaleString() : '-' }} · {{ item.purchaseDate || '-' }}
        </div>
        <span class="un-last">
          🕰 最后使用 {{ item.lastUsedDate || dayjs(item.createdAt).format('YYYY-MM-DD') || '-' }}
        </span>
        <div class="un-acts">
          <button class="un-btn drop" @click="handleAction(item, 'discarded')">丢弃</button>
          <button class="un-btn donate" @click="handleAction(item, 'donated')">捐赠</button>
          <button class="un-btn sell" @click="handleAction(item, 'sold')">二手出售</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, nextTick } from 'vue'
import { inventoryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const items = ref([])
const months = ref(12)
const loading = ref(false)
const loadError = ref(false)

const totalValue = computed(() => {
  return items.value.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
})

// 分类颜色和 emoji
const categoryMap = {
  '电子产品': { bg: 'rgba(159,184,201,.2)', emoji: '💻' },
  '食品': { bg: 'rgba(232,179,106,.2)', emoji: '🥛' },
  '绿植': { bg: 'rgba(168,176,138,.2)', emoji: '🪴' },
  '玩具': { bg: 'rgba(217,154,154,.2)', emoji: '🧸' },
  '厨具': { bg: 'rgba(200,159,133,.2)', emoji: '🍳' },
  '运动': { bg: 'rgba(159,184,201,.2)', emoji: '🏃' },
  '乐器': { bg: 'rgba(217,154,154,.2)', emoji: '🎸' },
  '户外': { bg: 'rgba(232,179,106,.2)', emoji: '🧺' },
  '书籍': { bg: 'rgba(169,139,176,.2)', emoji: '📚' },
  '衣物': { bg: 'rgba(217,154,154,.2)', emoji: '👕' },
}
const defaultItemBg = 'rgba(200,159,133,.15)'
const defaultItemEmoji = '📦'

function getItemColor(cat) { return categoryMap[cat]?.bg || defaultItemBg }
function getItemEmoji(cat) { return categoryMap[cat]?.emoji || defaultItemEmoji }

function getUnusedMonths(item) {
  const lastUsed = item.lastUsedDate || item.createdAt
  if (!lastUsed) return months.value
  return Math.max(1, dayjs().diff(dayjs(lastUsed), 'month'))
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadItems()
  nextTick(setupReveal)
})

async function loadItems() {
  loadError.value = false
  loading.value = true
  try {
    const res = await inventoryApi.getUnused({ familyId: authStore.currentFamily?.id, months: months.value })
    items.value = res.data
    nextTick(setupReveal)
  } catch (e) {
    console.error('[Unused] 加载失败', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const statusLabels = { discarded: '丢弃', donated: '捐赠', sold: '二手出售' }

async function handleAction(row, status) {
  try {
    await inventoryApi.updateItem(row.id, { status })
    ElMessage.success(`已标记为${statusLabels[status]}`)
    items.value = items.value.filter(i => i.id !== row.id)
  } catch { /* request.js 已处理错误提示 */ }
}
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.page-sub {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--text-secondary);
}
.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== 按钮 ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2;
  box-shadow: 0 8px 20px rgba(200,159,133,.4);
  transition: transform .3s, box-shadow .3s;
}
.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.3);
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: 1.5px solid var(--border);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,253,250,.85);
  color: var(--terra-deep);
  transition: transform .3s, box-shadow .3s;
}
.btn-ghost:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.15);
}

/* ===== 子标签页 ===== */
.subtabs {
  display: flex;
  gap: 6px;
  background: rgba(243,234,221,.6);
  border: 1px solid var(--border);
  padding: 5px;
  border-radius: 16px;
  margin-bottom: 22px;
  overflow-x: auto;
}
.subtab {
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all .3s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 7px;
}
.subtab:hover { color: var(--terra-deep); }
.subtab.active,
.subtab.router-link-exact-active {
  background: var(--bg-card);
  color: var(--terra-deep);
  box-shadow: 0 4px 14px rgba(160,120,90,.14);
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  align-items: center;
}
.months-label {
  font-size: 13.5px;
  color: var(--text-secondary);
}
.m-chip {
  padding: 8px 15px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.8);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
}
.m-chip:hover {
  border-color: var(--terracotta);
  color: var(--terra-deep);
}
.m-chip.active {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: #fff;
}

/* ===== 汇总卡片 ===== */
.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  margin-bottom: 18px;
  background: linear-gradient(120deg, rgba(168,176,138,.16), rgba(232,179,106,.14));
  border: 1.5px solid rgba(168,176,138,.4);
}
.summary-ico {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--sage), #7E8862);
  color: #fff;
  font-size: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}
.summary-text b {
  color: #7E8862;
}

/* ===== 空状态 ===== */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-card p {
  margin-top: 12px;
  color: var(--text-secondary);
}

/* ===== 加载/错误状态 ===== */
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--terracotta);
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-card {
  text-align: center;
  padding: 60px 20px;
}
.error-card p {
  margin-top: 12px;
  color: var(--text-secondary);
}

/* ===== 闲置物品网格 ===== */
.unused-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.unused-card {
  padding: 18px;
  position: relative;
  overflow: hidden;
  transition: transform .35s, box-shadow .35s;
}
.unused-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(160,120,90,.16);
}
.unused-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, var(--amber), #C08A3E);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 0 0 0 14px;
}
.un-ico {
  width: 50px;
  height: 50px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  opacity: .85;
  filter: grayscale(.25);
}
.un-name {
  font-size: 15px;
  font-weight: 700;
}
.un-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.6;
}
.un-last {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #B06A6A;
  background: rgba(217,154,154,.16);
  padding: 3px 10px;
  border-radius: 999px;
}
.un-acts {
  display: flex;
  gap: 7px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px dashed var(--border);
}
.un-btn {
  flex: 1;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.8);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
  color: var(--text-primary);
}
.un-btn:hover {
  transform: translateY(-2px);
}
.un-btn.drop:hover {
  background: var(--rose);
  border-color: var(--rose);
  color: #fff;
}
.un-btn.donate:hover {
  background: var(--amber);
  border-color: var(--amber);
  color: #fff;
}
.un-btn.sell:hover {
  background: var(--sage);
  border-color: var(--sage);
  color: #fff;
}

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .unused-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .page-head {
    gap: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .subtabs {
    gap: 4px;
    padding: 4px;
  }
  .subtab {
    padding: 8px 12px;
    font-size: 13px;
  }
  .unused-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    gap: 6px;
  }
  .m-chip {
    padding: 6px 12px;
    font-size: 12px;
  }
  .summary-card {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>

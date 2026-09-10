<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-head">
      <div>
        <div class="page-title">📦 物品管理</div>
        <div class="page-sub">家里的每件东西，都有属于自己的位置</div>
      </div>
      <div class="head-actions">
        <el-button class="btn-ghost" @click="showAiDialog = true">
          <span>🪄</span> AI 录入
        </el-button>
        <el-button class="btn-primary" @click="openAddForm">
          <span>＋</span> 添加物品
        </el-button>
      </div>
    </div>

    <!-- 子标签页 -->
    <div class="subtabs">
      <router-link to="/inventory" class="subtab" :class="{ active: $route.path === '/inventory' }">🗃 物品总览</router-link>
      <router-link to="/inventory/spaces" class="subtab">🏠 空间管理</router-link>
      <router-link to="/inventory/borrows" class="subtab">🤝 借物追踪</router-link>
      <router-link to="/inventory/unused" class="subtab">🍃 断舍离</router-link>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid reveal">
      <div class="card stat-card stat-sky">
        <div class="stat-icon" style="background:linear-gradient(135deg,var(--sky),#6E8CA0);">🗃</div>
        <div class="stat-num" style="color:#6E8CA0;">{{ stats.total }}</div>
        <div class="stat-lbl">物品总数</div>
      </div>
      <div class="card stat-card stat-amber">
        <div class="stat-icon" style="background:linear-gradient(135deg,var(--amber),#C08A3E);">⏰</div>
        <div class="stat-num" style="color:#C08A3E;">{{ stats.expiring }}</div>
        <div class="stat-lbl">临期物品</div>
      </div>
      <div class="card stat-card stat-rose">
        <div class="stat-icon" style="background:linear-gradient(135deg,var(--rose),#B06A6A);">🤝</div>
        <div class="stat-num" style="color:#B06A6A;">{{ stats.borrowed }}</div>
        <div class="stat-lbl">借出中</div>
      </div>
    </div>

    <!-- 临期提醒 -->
    <div v-if="reminders.length > 0" class="card alert-card reveal">
      <div class="alert-ai">⚠️</div>
      <div class="alert-body">
        <div class="alert-title">临期提醒 · 别忘了先用完它们</div>
        <div class="alert-list">
          <div v-for="r in reminders.slice(0, 5)" :key="r.item?.id || r.title" class="alert-row">
            <span>{{ r.title }}</span>
            <span class="alert-date" :class="{ warn: !r.urgent }">{{ r.date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar reveal">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          class="search-input"
          placeholder="搜索物品..."
          @keyup.enter="loadItems"
        />
      </div>
      <el-tree-select
        v-model="filterSpaceId"
        :data="spaceTree"
        :props="{ label: 'name', value: 'id', children: 'children' }"
        placeholder="📍 按位置"
        class="filter-select"
        clearable
        check-strictly
        popper-class="warm-popper"
        @change="loadItems"
      />
      <el-input
        v-model="filterCategory"
        placeholder="🏷 按分类"
        class="filter-input"
        clearable
        @clear="loadItems"
        @keyup.enter="loadItems"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="card empty-card">
      <el-icon :size="48" color="var(--wood-light)"><Box /></el-icon>
      <p>暂无物品，点击右上角添加</p>
    </div>

    <!-- 物品网格 -->
    <div v-else class="items-grid">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="card item-card reveal"
        :style="{ animationDelay: (idx % 8) * 60 + 'ms' }"
      >
        <div class="item-actions">
          <button class="act-btn" @click.stop="editItem(item)">✎</button>
          <el-popconfirm title="确定删除此物品？" @confirm="handleDelete(item.id)">
            <template #reference>
              <button class="act-btn danger" @click.stop>🗑</button>
            </template>
          </el-popconfirm>
        </div>
        <div class="item-top">
          <div class="item-ico" :style="{ background: getItemColor(item.category) }">
            {{ getItemEmoji(item.category) }}
          </div>
          <span class="item-status" :class="getItemStatusClass(item)">
            {{ getItemStatusText(item) }}
          </span>
        </div>
        <div class="item-name">{{ item.name }}</div>
        <span v-if="item.category" class="item-cat">{{ item.category }}</span>
        <div class="item-meta">
          <span class="item-space">📍 {{ item.Space?.name || '-' }}</span>
          <span class="item-price">{{ item.price ? `¥${parseFloat(item.price).toLocaleString()}` : '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadItems"
      />
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="editing ? '✏️ 编辑物品' : '📦 添加物品'" width="520px" top="8vh" class="warm-dialog">
      <el-form :model="itemForm" label-width="90px" class="warm-form">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="物品名称"><el-input v-model="itemForm.name" placeholder="输入物品名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="数量"><el-input-number v-model="itemForm.quantity" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="分类"><el-input v-model="itemForm.category" placeholder="如：电子产品、食品" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="价格"><el-input v-model="itemForm.price" type="number" step="0.01" placeholder="0.00"><template #append>¥</template></el-input></el-form-item></el-col>
        </el-row>
        <el-form-item label="存放位置">
          <el-tree-select
            ref="spaceTreeRef"
            v-model="itemForm.spaceId"
            :data="spaceTreeWithRecent"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="🔍 搜索或选择位置"
            style="width:100%"
            check-strictly
            filterable
            teleported
            popper-class="warm-popper warm-tree-popper"
            :default-expanded-keys="defaultExpandedKeys"
            :render-after-expand="false"
            @visible-change="onDropdownVisibleChange"
          />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="购买日期"><el-date-picker v-model="itemForm.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" popper-class="warm-popper" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保修期(月)"><el-input-number v-model="itemForm.warrantyMonths" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="生产日期"><el-date-picker v-model="itemForm.productionDate" type="date" value-format="YYYY-MM-DD" style="width:100%" clearable popper-class="warm-popper" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保质期(月)">
            <el-select v-model="itemForm.shelfLife" placeholder="请选择" style="width:100%" clearable popper-class="warm-popper" @change="onShelfLifeChange">
              <el-option v-for="m in shelfLifeOptions" :key="m" :label="m + '个月'" :value="m" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="过期日期">
          <el-date-picker v-model="itemForm.expiryDate" type="date" value-format="YYYY-MM-DD" style="width:100%" clearable popper-class="warm-popper" :disabled="!!(itemForm.productionDate && itemForm.shelfLife)" />
          <div v-if="itemForm.productionDate && itemForm.shelfLife" class="form-hint">📅 根据生产日期和保质期自动推算</div>
        </el-form-item>
        <el-form-item label="标签"><el-input v-model="itemForm.tags" placeholder="用逗号分隔，如：常用,厨房" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="itemForm.description" type="textarea" :rows="2" placeholder="添加备注信息..." /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" :class="{ loading: saving }" :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : (editing ? '✏️ 更新物品' : '📦 添加物品') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 录入弹窗 -->
    <el-dialog v-model="showAiDialog" title="🪄 AI 智能录入" width="480px" top="20vh" class="warm-dialog">
      <div class="ai-section">
        <div class="ai-desc">输入物品名称和过期时间，AI 自动识别并填充。</div>
        <div class="ai-examples-label">💡 示例：</div>
        <div class="ai-examples">
          <span v-for="ex in aiExamples" :key="ex" class="ai-chip" @click="aiInput = ex">{{ ex }}</span>
        </div>
        <el-input v-model="aiInput" placeholder="例如：牛奶 保质期6个月" clearable class="ai-input" />
      </div>
      <div v-if="aiResult" class="ai-result">
        <div class="ai-result-title">✨ 识别结果</div>
        <div class="ai-result-row">
          <span class="ai-result-label">物品名称</span>
          <span class="ai-result-value">{{ aiResult.name }}</span>
        </div>
        <div class="ai-result-row">
          <span class="ai-result-label">过期时间</span>
          <span class="ai-result-value">{{ aiResult.expiryDate || '未设置' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showAiDialog = false">取消</button>
          <button v-if="aiResult" class="btn-confirm" style="background:linear-gradient(135deg,var(--sage),#7E8862);" @click="applyAiResult">✨ 应用并添加</button>
          <button class="btn-confirm" :class="{ loading: aiLoading }" :disabled="aiLoading" @click="aiRecognize">
            {{ aiLoading ? '识别中...' : (aiResult ? '🔄 重新识别' : '🪄 开始识别') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { inventoryApi, dashboardApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const items = ref([])
const spaceTree = ref([])
const reminders = ref([])

// 最近选择的位置
const RECENT_KEY = 'inventory_recent_spaces'
function getRecentSpaceIds() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecentSpace(spaceId) {
  if (!spaceId) return
  const ids = getRecentSpaceIds().filter(id => id !== spaceId)
  ids.unshift(spaceId)
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 5)))
}
function findSpaceName(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n.name
    if (n.children) { const r = findSpaceName(n.children, id); if (r) return r }
  }
  return null
}
const spaceTreeWithRecent = computed(() => {
  const recentIds = getRecentSpaceIds()
  if (!recentIds.length) return spaceTree.value
  const recentChildren = recentIds
    .map(id => ({ id, name: findSpaceName(spaceTree.value, id) }))
    .filter(n => n.name)
  if (!recentChildren.length) return spaceTree.value
  return [{ id: '__recent__', name: '⭐ 最近选择', children: recentChildren }, ...spaceTree.value]
})
const spaceTreeRef = ref(null)
const defaultExpandedKeys = computed(() => {
  return spaceTreeWithRecent.value.some(n => n.id === '__recent__') ? ['__recent__'] : []
})
function onDropdownVisibleChange(visible) {
  if (visible) {
    nextTick(() => {
      const treeRef = spaceTreeRef.value?.treeRef
      if (treeRef && defaultExpandedKeys.value.length) {
        treeRef.setExpandedKeys(defaultExpandedKeys.value)
      }
    })
  }
}

const search = ref('')
const filterSpaceId = ref(null)
const filterCategory = ref('')
const page = ref(1), pageSize = ref(20), total = ref(0)
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const loading = ref(false)
const stats = reactive({ total: 0, expiring: 0, borrowed: 0 })

const shelfLifeOptions = [1, 2, 3, 6, 8, 12, 18, 24, 36]
const defaultForm = {
  name: '', quantity: 1, price: 9.9, category: '', spaceId: null,
  purchaseDate: dayjs().format('YYYY-MM-DD'), warrantyMonths: 0,
  productionDate: '', shelfLife: null, expiryDate: '', tags: '',
  description: '', lastUsedDate: dayjs().format('YYYY-MM-DD')
}
const itemForm = reactive({ ...defaultForm })

function isExpiring(date) {
  return date && dayjs(date).diff(dayjs(), 'day') <= 7 && dayjs(date).diff(dayjs(), 'day') >= 0
}

function onShelfLifeChange() {
  if (itemForm.productionDate && itemForm.shelfLife) {
    itemForm.expiryDate = dayjs(itemForm.productionDate).add(itemForm.shelfLife, 'month').format('YYYY-MM-DD')
  }
}

watch(() => itemForm.productionDate, () => {
  if (itemForm.productionDate && itemForm.shelfLife) {
    itemForm.expiryDate = dayjs(itemForm.productionDate).add(itemForm.shelfLife, 'month').format('YYYY-MM-DD')
  }
})

// 物品分类对应颜色和 emoji
const categoryMap = {
  '电子产品': { bg: 'rgba(159,184,201,.2)', emoji: '💻' },
  '食品': { bg: 'rgba(232,179,106,.2)', emoji: '🥛' },
  '绿植': { bg: 'rgba(168,176,138,.2)', emoji: '🪴' },
  '玩具': { bg: 'rgba(217,154,154,.2)', emoji: '🧸' },
  '厨具': { bg: 'rgba(200,159,133,.2)', emoji: '🍳' },
  '药品': { bg: 'rgba(159,184,201,.2)', emoji: '💊' },
  '户外': { bg: 'rgba(232,179,106,.2)', emoji: '🧺' },
  '书籍': { bg: 'rgba(169,139,176,.2)', emoji: '📚' },
  '衣物': { bg: 'rgba(217,154,154,.2)', emoji: '👕' },
  '日用品': { bg: 'rgba(200,159,133,.2)', emoji: '🧴' },
}
const defaultItemBg = 'rgba(200,159,133,.15)'
const defaultItemEmoji = '📦'

function getItemColor(cat) {
  return categoryMap[cat]?.bg || defaultItemBg
}
function getItemEmoji(cat) {
  return categoryMap[cat]?.emoji || defaultItemEmoji
}

function getItemStatusClass(item) {
  if (item.status !== 'active') return 'st-inactive'
  if (isExpiring(item.expiryDate)) return 'st-exp'
  return 'st-active'
}

function getItemStatusText(item) {
  if (item.status === 'discarded') return '已丢弃'
  if (item.status === 'donated') return '已捐赠'
  if (item.status === 'sold') return '已售出'
  if (isExpiring(item.expiryDate)) return '临期'
  return '在用'
}

// AI 录入
const showAiDialog = ref(false)
const aiInput = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const aiExamples = [
  '牛奶 保质期6个月',
  '面包 明天过期',
  '酸奶 2025-12-31过期',
  '方便面 保质期12个月'
]

async function aiRecognize() {
  if (!aiInput.value.trim()) return ElMessage.warning('请输入物品信息')
  aiLoading.value = true
  aiResult.value = null
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `请帮我创建一个物品记录，物品信息：${aiInput.value}` }],
        familyId: authStore.currentFamily?.id
      })
    })
    const data = await res.json()
    if (data.code === 0 && data.data?.toolCall?.result?.item) {
      aiResult.value = data.data.toolCall.result.item
    } else {
      ElMessage.error(data.message || '识别失败，请重试')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('AI 服务请求失败')
  } finally {
    aiLoading.value = false
  }
}

function applyAiResult() {
  if (!aiResult.value) return
  resetForm()
  Object.assign(itemForm, {
    name: aiResult.value.name || '',
    expiryDate: aiResult.value.expiryDate || ''
  })
  showAiDialog.value = false
  editing.value = false
  showForm.value = true
  aiInput.value = ''
  aiResult.value = null
}

// Intersection Observer for reveal animations
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
  await loadSpaces()
  loadItems()
  loadStats()
  loadReminders()
  nextTick(setupReveal)
})

async function loadSpaces() {
  const res = await inventoryApi.getSpaces({ familyId: authStore.currentFamily?.id })
  spaceTree.value = res.data
}

async function loadItems() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, familyId: authStore.currentFamily?.id }
    if (search.value) params.search = search.value
    if (filterSpaceId.value) params.spaceId = filterSpaceId.value
    if (filterCategory.value) params.category = filterCategory.value
    const res = await inventoryApi.getItems(params)
    items.value = res.data.list
    total.value = res.data.total
    nextTick(setupReveal)
  } finally { loading.value = false }
}

async function loadStats() {
  try {
    const dashRes = await dashboardApi.getData({ familyId: authStore.currentFamily?.id })
    stats.total = dashRes.data.inventory?.totalItems || 0
    stats.expiring = dashRes.data.inventory?.expiringItems || 0
  } catch (e) { console.error(e) }
}

async function loadReminders() {
  try {
    const res = await inventoryApi.getReminders({ familyId: authStore.currentFamily?.id })
    reminders.value = res.data || []
  } catch (e) { console.error(e) }
}

function resetForm() {
  Object.assign(itemForm, { ...defaultForm })
}

function editItem(row) {
  Object.assign(itemForm, { ...defaultForm, ...row })
  if (row.Space) itemForm.spaceId = row.Space.id
  editing.value = true
  showForm.value = true
}

function openAddForm() {
  resetForm()
  editing.value = false
  showForm.value = true
}

async function handleSave() {
  if (!itemForm.name) return ElMessage.warning('请输入物品名称')
  saving.value = true
  try {
    if (editing.value) {
      await inventoryApi.updateItem(itemForm.id, itemForm)
      ElMessage.success('更新成功')
    } else {
      await inventoryApi.createItem({ ...itemForm, familyId: authStore.currentFamily?.id })
      ElMessage.success('添加成功')
    }
    saveRecentSpace(itemForm.spaceId)
    showForm.value = false
    resetForm()
    loadItems()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await inventoryApi.deleteItem(id)
    ElMessage.success('已删除')
    loadItems()
  } catch (e) { console.error(e) }
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

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}
.stat-card {
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: transform .35s, box-shadow .35s;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(160,120,90,.15);
}
.stat-card::after {
  content: "";
  position: absolute;
  right: -28px;
  top: -28px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: .14;
}
.stat-sky::after { background: var(--sky); }
.stat-amber::after { background: var(--amber); }
.stat-rose::after { background: var(--rose); }

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  color: #fff;
  margin-bottom: 12px;
}
.stat-num {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -.02em;
}
.stat-lbl {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* ===== 临期提醒 ===== */
.alert-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  margin-bottom: 18px;
  border: 1.5px solid rgba(232,179,106,.5);
  background: rgba(232,179,106,.12);
}
.alert-ai {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--amber), #C08A3E);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  animation: wobble 2.6s ease-in-out infinite;
}
@keyframes wobble {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
.alert-body { flex: 1; }
.alert-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #C08A3E;
}
.alert-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--text-primary);
}
.alert-date {
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(217,154,154,.2);
  color: #B06A6A;
}
.alert-date.warn {
  background: rgba(232,179,106,.25);
  color: #C08A3E;
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  align-items: center;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 300px;
}
.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .6;
  font-size: 14px;
}
.search-input {
  width: 100%;
  padding: 11px 14px 11px 38px;
  border-radius: 12px;
  border: 1.5px solid var(--wood-light);
  background: #FFFDF9;
  font-size: 13.5px;
  outline: none;
  transition: all .3s;
  color: var(--text-primary);
  font-family: inherit;
}
.search-input:focus {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 4px rgba(200,159,133,.14);
}
.filter-select {
  width: 160px;
}
.filter-input {
  width: 140px;
}

/* ===== 物品网格 ===== */
.items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.item-card {
  padding: 16px;
  position: relative;
  transition: transform .35s, box-shadow .35s;
  cursor: pointer;
}
.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(160,120,90,.16);
}
.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}
.item-ico {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  transition: transform .4s cubic-bezier(.34,1.56,.64,1);
}
.item-card:hover .item-ico {
  transform: scale(1.12) rotate(-6deg);
}
.item-status {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}
.st-active {
  background: rgba(168,176,138,.2);
  color: #7E8862;
}
.st-exp {
  background: rgba(217,154,154,.2);
  color: #B06A6A;
  animation: pulse-soft 2s infinite;
}
.st-inactive {
  background: rgba(160,141,122,.15);
  color: var(--text-secondary);
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: .55; }
}
.item-name {
  font-size: 15px;
  font-weight: 700;
}
.item-cat {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--apricot);
  color: var(--terra-deep);
  margin-top: 6px;
}
.item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px dashed var(--border);
  font-size: 12px;
  color: var(--text-secondary);
}
.item-price {
  font-weight: 700;
  color: var(--terra-deep);
  font-size: 13px;
}
.item-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity .25s;
}
.item-card:hover .item-actions {
  opacity: 1;
}
.act-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(255,253,250,.9);
  color: var(--terra-deep);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(160,120,90,.15);
  transition: all .2s;
}
.act-btn:hover {
  background: var(--terracotta);
  color: #fff;
}
.act-btn.danger:hover {
  background: #B06A6A;
}

/* ===== 空状态 ===== */

/* ===== 分页 ===== */
.pagination-wrap {
  text-align: center;
  padding: 12px;
}

/* ===== 暖色弹窗 ===== */
:deep(.warm-dialog.el-dialog) {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(160,120,90,.18);
  overflow: visible;
}
:deep(.warm-dialog .el-overlay) {
  overflow: visible;
}
:deep(.warm-dialog.el-dialog .el-dialog__header) {
  padding: 20px 24px 0;
  margin: 0;
}
:deep(.warm-dialog.el-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: var(--terra-deep);
}
:deep(.warm-dialog.el-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--text-secondary);
  font-size: 18px;
}
:deep(.warm-dialog.el-dialog .el-dialog__body) {
  padding: 16px 24px 8px;
}
:deep(.warm-dialog.el-dialog .el-dialog__footer) {
  padding: 8px 24px 20px;
}

/* 表单样式 */
:deep(.warm-form .el-form-item__label) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 13px;
}
:deep(.warm-form .el-input__wrapper) {
  background: #FFFDF9;
  border: 1.5px solid var(--wood-light);
  border-radius: 12px;
  box-shadow: none;
  transition: border-color .3s, box-shadow .3s;
}
:deep(.warm-form .el-input__wrapper:hover) {
  border-color: var(--terracotta);
}
:deep(.warm-form .el-input__wrapper.is-focus) {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(200,159,133,.12);
}
:deep(.warm-form .el-textarea__inner) {
  background: #FFFDF9;
  border: 1.5px solid var(--wood-light);
  border-radius: 12px;
  box-shadow: none;
  transition: border-color .3s, box-shadow .3s;
}
:deep(.warm-form .el-textarea__inner:focus) {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(200,159,133,.12);
}
:deep(.warm-form .el-select .el-input__wrapper) {
  background: #FFFDF9;
}
:deep(.warm-form .el-input-number .el-input__wrapper) {
  background: #FFFDF9;
}
:deep(.warm-form .el-date-editor.el-input__wrapper) {
  background: #FFFDF9;
}
.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  padding: 10px 20px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.85);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
  font-family: inherit;
}
.btn-cancel:hover {
  border-color: var(--terracotta);
  color: var(--terra-deep);
}
.btn-confirm {
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(200,159,133,.35);
  transition: all .25s;
  font-family: inherit;
}
.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(200,159,133,.4);
}
.btn-confirm.loading {
  opacity: .7;
  cursor: not-allowed;
  transform: none;
}

/* AI 弹窗 */
.ai-section { margin-bottom: 12px; }
.ai-desc { font-size: 14px; color: var(--text-primary); margin-bottom: 12px; }
.ai-examples-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.ai-examples { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.ai-chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.8);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
}
.ai-chip:hover {
  border-color: var(--terracotta);
  color: var(--terra-deep);
  background: var(--apricot);
}
.ai-result {
  background: linear-gradient(120deg, rgba(168,176,138,.12), rgba(232,179,106,.1));
  border: 1.5px solid rgba(168,176,138,.35);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
}
.ai-result-title { font-weight: 700; font-size: 14px; color: var(--terra-deep); margin-bottom: 10px; }
.ai-result-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.ai-result-label { color: var(--text-secondary); }
.ai-result-value { color: var(--text-primary); font-weight: 600; }

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .page-head {
    gap: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .items-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .subtabs {
    gap: 4px;
    padding: 4px;
  }
  .subtab {
    padding: 8px 12px;
    font-size: 13px;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrap {
    max-width: none;
  }
  .filter-select,
  .filter-input {
    width: 100%;
  }
  .alert-card {
    flex-direction: column;
    gap: 10px;
  }
  .item-card:hover .item-actions {
    opacity: 1;
  }
}
</style>

<!-- 全局：暖色下拉框（teleport 到 body，scoped 覆盖不到） -->
<style>
/* ===== 强制弹窗不裁剪 ===== */
.warm-dialog.el-dialog {
  overflow: visible !important;
}
.warm-dialog.el-dialog .el-dialog__body {
  overflow: visible !important;
}

/* ===== 所有暖色 popper 提到弹窗之上 ===== */
.warm-popper,
.warm-popper.el-popper,
.warm-popper.el-select__popper,
.warm-popper.el-picker-panel,
.warm-tree-popper,
.warm-tree-popper.el-popper,
.warm-tree-popper.el-select__popper {
  z-index: 32000 !important;
}

/* ===== 下拉面板基础 ===== */
.warm-popper {
  background: #FFFDFA !important;
  border: 1.5px solid #E2CDB2 !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 36px rgba(160,120,90,.18) !important;
}
.warm-popper .el-popper__arrow::before {
  background: #FFFDFA !important;
  border-color: #E2CDB2 !important;
}

/* ===== 选项样式 ===== */
.warm-popper .el-select-dropdown__item {
  color: #6B5744;
  font-size: 13.5px;
  border-radius: 8px;
  margin: 2px 6px;
  padding: 8px 12px;
  height: auto;
  line-height: 1.5;
}
.warm-popper .el-select-dropdown__item.hover,
.warm-popper .el-select-dropdown__item:hover {
  background: #F3EADD !important;
  color: #96684A !important;
}
.warm-popper .el-select-dropdown__item.is-selected {
  color: #96684A !important;
  font-weight: 700;
  background: rgba(200,159,133,.12) !important;
}
.warm-popper .el-select-dropdown__empty {
  color: #A08D7A;
  padding: 20px;
}
.warm-popper .el-select-dropdown__wrap {
  max-height: 260px;
}

/* ===== 树形选择器 ===== */
.warm-tree-popper {
  min-width: 280px !important;
}
.warm-tree-popper .el-select-dropdown {
  background: transparent;
  border: none;
  box-shadow: none;
}
.warm-tree-popper .el-tree {
  background: transparent;
  padding: 4px;
}
.warm-tree-popper .el-tree-node__content {
  border-radius: 8px;
  margin: 1px 2px;
  padding: 5px 8px;
  height: auto;
  min-height: 32px;
}
.warm-tree-popper .el-tree-node__content:hover {
  background: #F3EADD !important;
}
.warm-tree-popper .el-tree-node.is-current > .el-tree-node__content {
  background: rgba(200,159,133,.15) !important;
  color: #96684A;
  font-weight: 600;
}
.warm-tree-popper .el-tree-node__label {
  font-size: 13.5px;
  color: #6B5744;
}
.warm-tree-popper .el-tree-node__expand-icon {
  color: #A08D7A;
}
.warm-tree-popper .el-select-dropdown__header {
  padding: 8px 12px;
  border-bottom: 1px solid #E2CDB2;
}

/* ===== 日期选择器 ===== */
.warm-popper .el-picker-panel__body {
  background: #FFFDFA;
}
.warm-popper .el-date-table td.today .el-date-table-cell__text {
  color: #C89F85;
}
.warm-popper .el-date-table td.current .el-date-table-cell__text {
  background: linear-gradient(135deg, #C89F85, #D3A98B);
  color: #fff;
  border-radius: 8px;
}
.warm-popper .el-date-table td.available:hover .el-date-table-cell__text {
  background: #F3EADD;
  border-radius: 8px;
}
.warm-popper .el-picker-panel__footer {
  background: #FFFDFA;
  border-top: 1px solid #E2CDB2;
}
.warm-popper .el-picker-panel__sidebar {
  background: #FFFDFA;
  border-right: 1px solid #E2CDB2;
}
.warm-popper .el-picker-panel__shortcut {
  color: #A08D7A;
  font-size: 12.5px;
}
.warm-popper .el-picker-panel__shortcut:hover {
  color: #96684A;
}
.warm-popper .el-picker-panel__icon-btn {
  color: #A08D7A;
}
.warm-popper .el-picker-panel__icon-btn:hover {
  color: #96684A;
}
.warm-popper .el-date-picker__header-label {
  color: #6B5744;
  font-weight: 600;
}
.warm-popper .el-date-picker__header-label:hover {
  color: #96684A;
}
.warm-popper .el-month-table td.today .el-date-table-cell__text,
.warm-popper .el-year-table td.today .el-date-table-cell__text {
  color: #C89F85;
}
.warm-popper .el-month-table td.current .el-date-table-cell__text,
.warm-popper .el-year-table td.current .el-date-table-cell__text {
  background: linear-gradient(135deg, #C89F85, #D3A98B);
  color: #fff;
  border-radius: 8px;
}
</style>

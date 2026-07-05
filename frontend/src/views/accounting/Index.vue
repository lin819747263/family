<template>
  <div>
    <div class="page-header">
      <div class="page-title">流水账单</div>
      <div class="header-actions">
        <div class="month-nav">
          <el-button :icon="ArrowLeft" size="small" circle @click="changeMonth(-1)" />
          <span class="month-label">{{ monthLabel }}</span>
          <el-button :icon="ArrowRight" size="small" circle @click="changeMonth(1)" />
        </div>
        <el-button @click="$router.push('/accounting/recurring')">
          <el-icon><Timer /></el-icon>定时记账
        </el-button>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>记一笔</el-button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="summary-row">
      <div class="summary-item">
        <span class="sum-label">收入</span>
        <span class="sum-val income">+¥{{ formatMoney(summary.income) }}</span>
      </div>
      <div class="summary-item">
        <span class="sum-label">支出</span>
        <span class="sum-val expense">-¥{{ formatMoney(summary.expense) }}</span>
      </div>
      <div class="summary-item">
        <span class="sum-label">结余</span>
        <span class="sum-val balance">¥{{ formatMoney(summary.income - summary.expense) }}</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-search-wrap">
        <el-icon class="filter-search-icon"><Search /></el-icon>
        <input
          v-model="searchKeyword"
          class="filter-search-input"
          placeholder="搜索备注、分类..."
          @keyup.enter="handleFilter"
          @clear="handleFilter"
        />
        <button v-if="searchKeyword" class="filter-search-clear" @click="searchKeyword = ''; handleFilter()">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <div class="filter-chips">
        <button
          class="filter-chip"
          :class="{ active: filterType === '' }"
          @click="filterType = ''; handleFilter()"
        >全部</button>
        <button
          class="filter-chip expense"
          :class="{ active: filterType === 'expense' }"
          @click="filterType = 'expense'; handleFilter()"
        >📉 支出</button>
        <button
          class="filter-chip income"
          :class="{ active: filterType === 'income' }"
          @click="filterType = 'income'; handleFilter()"
        >📈 收入</button>
        <!-- 分类筛选 -->
        <div class="filter-cat-wrap" ref="catWrapRef">
          <button
            class="filter-chip cat-chip"
            :class="{ active: filterCategoryId }"
            @click="showCatPicker = !showCatPicker"
          >
            <span v-if="selectedCatName">{{ selectedCatName }}</span>
            <span v-else>📂 分类</span>
            <span v-if="filterCategoryId" class="cat-chip-clear" @click.stop="selectCat(null)">✕</span>
            <el-icon v-else class="cat-chip-arrow"><ArrowDown /></el-icon>
          </button>
          <Transition name="cat-dropdown">
            <div v-if="showCatPicker" class="cat-dropdown">
              <div class="cat-dropdown-search">
                <el-icon><Search /></el-icon>
                <input
                  v-model="catSearch"
                  class="cat-search-input"
                  placeholder="搜索分类..."
                  ref="catSearchRef"
                />
              </div>
              <div class="cat-dropdown-list">
                <div
                  class="cat-dropdown-item all"
                  :class="{ active: !filterCategoryId }"
                  @click="selectCat(null)"
                >
                  <span class="cat-item-icon">📋</span>
                  <span>全部分类</span>
                  <el-icon v-if="!filterCategoryId" class="cat-item-check"><Check /></el-icon>
                </div>
                <template v-for="group in filteredCatTree" :key="group.id">
                  <!-- 无子分类的一级分类：直接作为可选项 -->
                  <div
                    v-if="group.children.length === 0"
                    class="cat-dropdown-item"
                    :class="{ active: filterCategoryId === group.id }"
                    @click="selectCat(group.id)"
                  >
                    <span class="cat-item-icon">{{ group.icon || '📄' }}</span>
                    <span class="cat-item-name">{{ group.name }}</span>
                    <el-icon v-if="filterCategoryId === group.id" class="cat-item-check"><Check /></el-icon>
                  </div>
                  <!-- 有子分类的一级分类：显示分组标签 -->
                  <template v-else>
                    <div class="cat-group-label">
                      <span>{{ group.icon }}</span>
                      <span>{{ group.name }}</span>
                    </div>
                    <div
                      v-for="child in group.children"
                      :key="child.id"
                      class="cat-dropdown-item"
                      :class="{ active: filterCategoryId === child.id }"
                      @click="selectCat(child.id)"
                    >
                      <span class="cat-item-icon">{{ child.icon || '📄' }}</span>
                      <span class="cat-item-name">{{ child.name }}</span>
                      <el-icon v-if="filterCategoryId === child.id" class="cat-item-check"><Check /></el-icon>
                    </div>
                  </template>
                </template>
                <div v-if="filteredCatTree.length === 0" class="cat-dropdown-empty">
                  没有找到分类
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 账单列表 -->
    <div class="card txn-card">
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <div v-else>
        <div v-if="transactions.length === 0" class="empty-state">
          <el-icon :size="48" color="#cbd5e1"><Document /></el-icon>
          <p>暂无账单记录</p>
        </div>

        <div v-for="group in groupedTransactions" :key="group.date" class="txn-group">
          <div class="group-header">
            <div class="group-left">
              <span class="group-date">{{ group.date }}</span>
              <el-tag size="small" type="info" effect="plain">{{ group.items.length }} 笔</el-tag>
            </div>
            <div class="group-right">
              <span class="group-income">收 +{{ formatMoney(group.income) }}</span>
              <span class="group-expense">支 -{{ formatMoney(group.expense) }}</span>
            </div>
          </div>

          <div v-for="t in group.items" :key="t.id" class="txn-row">
            <div class="txn-left">
              <el-tag :type="t.type === 'income' ? 'success' : 'danger'" size="small" effect="light" round>
                {{ t.type === 'income' ? '收入' : '支出' }}
              </el-tag>
              <el-tag v-if="t.Category" type="info" size="small" effect="plain" round>{{ t.Category.name }}</el-tag>
              <span class="txn-note">{{ t.note }}</span>
            </div>
            <div class="txn-right">
              <span class="txn-amount" :class="t.type">
                {{ t.type === 'income' ? '+' : '-' }}{{ formatMoney(t.amount) }}
              </span>
              <div class="txn-actions">
                <button class="act-btn" @click="openEdit(t)" title="编辑">
                  <el-icon :size="14"><Edit /></el-icon>
                </button>
                <el-popconfirm title="确定删除这条记录？" @confirm="handleDelete(t.id)">
                  <template #reference>
                    <button class="act-btn danger" title="删除">
                      <el-icon :size="14"><Delete /></el-icon>
                    </button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 分页 -->
      <div v-if="totalTxns > 20" class="pagination-wrap">
        <el-pagination
          layout="prev, pager, next"
          :total="totalTxns"
          :page-size="20"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新建弹窗 -->
    <el-dialog v-model="showCreate" title="记账" width="440px" top="10vh" destroy-on-close class="form-dialog">
      <TransactionForm @success="showCreate = false; loadData()" />
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEdit" title="编辑账单" width="440px" top="10vh" destroy-on-close class="form-dialog">
      <TransactionForm :edit-data="editTarget" @success="showEdit = false; loadData()" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import { useAuthStore } from '@/store/auth'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Search, Close, ArrowDown, Check } from '@element-plus/icons-vue'
import TransactionForm from '@/components/accounting/TransactionForm.vue'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'

const route = useRoute()
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const currentMonth = ref(dayjs().format('YYYY-MM'))
const filterCategoryId = ref('')
const filterType = ref('')
const searchKeyword = ref('')
const showCatPicker = ref(false)
const catSearch = ref('')
const catWrapRef = ref(null)
const catSearchRef = ref(null)
const categories = ref([])
const showCreate = ref(false)
const showEdit = ref(false)
const editTarget = ref(null)
const loading = ref(false)
const transactions = ref([])
const summary = reactive({ income: 0, expense: 0 })
const currentPage = ref(1)
const totalTxns = ref(0)

const monthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-')
  return `${y}年${parseInt(m)}月`
})

// 分类树（按父级分组）
const catTree = computed(() => {
  const filtered = categories.value.filter(c => {
    if (filterType.value) return c.type === filterType.value
    return true
  })
  const map = {}
  const roots = []
  filtered.forEach(c => { map[c.id] = { ...c, children: [] } })
  filtered.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id])
    } else if (!c.parentId) {
      roots.push(map[c.id])
    }
  })
  roots.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  roots.forEach(r => r.children.sort((a, b) => (a.sort || 0) - (b.sort || 0)))
  return roots
})

// 搜索过滤后的分类树
const filteredCatTree = computed(() => {
  if (!catSearch.value) return catTree.value
  const q = catSearch.value.toLowerCase()
  return catTree.value.map(g => ({
    ...g,
    children: g.children.filter(c => c.name.toLowerCase().includes(q))
  })).filter(g => g.name.toLowerCase().includes(q) || g.children.length > 0)
})

// 当前选中分类名称
const selectedCatName = computed(() => {
  if (!filterCategoryId.value) return ''
  const cat = categories.value.find(c => c.id === filterCategoryId.value)
  return cat ? cat.name : ''
})

const groupedTransactions = computed(() => {
  const groups = {}
  transactions.value.forEach(t => {
    const d = t.transactionDate
    if (!groups[d]) groups[d] = { date: d, items: [], income: 0, expense: 0 }
    groups[d].items.push(t)
    if (t.type === 'income') groups[d].income += parseFloat(t.amount || 0)
    else groups[d].expense += parseFloat(t.amount || 0)
  })
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

function changeMonth(delta) {
  currentMonth.value = dayjs(currentMonth.value + '-01').add(delta, 'month').format('YYYY-MM')
  currentPage.value = 1
  loadData()
}

function selectCat(id) {
  filterCategoryId.value = id
  showCatPicker.value = false
  catSearch.value = ''
  handleFilter()
}

// 点击外部关闭分类下拉
function onDocClick(e) {
  if (catWrapRef.value && !catWrapRef.value.contains(e.target)) {
    showCatPicker.value = false
    catSearch.value = ''
  }
}

watch(showCatPicker, (val) => {
  if (val) {
    document.addEventListener('click', onDocClick, true)
    nextTick(() => catSearchRef.value?.focus())
  } else {
    document.removeEventListener('click', onDocClick, true)
  }
})

function handlePageChange(page) {
  currentPage.value = page
  loadData()
}

function openCreate() {
  showCreate.value = true
}

function openEdit(t) {
  editTarget.value = { ...t }
  showEdit.value = true
}

async function handleDelete(id) {
  try {
    await accountingApi.deleteTransaction(id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) { console.error(e) }
}

async function loadCategories() {
  if (!authStore.currentFamily) return
  try {
    const res = await accountingApi.getCategories({ familyId: authStore.currentFamily.id })
    categories.value = res.data || []
  } catch (e) { console.error(e) }
}

function handleFilter() {
  currentPage.value = 1
  loadData()
}

function clearFilters() {
  filterType.value = ''
  filterCategoryId.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
  loadData()
}

onMounted(async () => {
  // 从年度总览跳转过来时，读取 query 参数
  if (route.query.month) currentMonth.value = route.query.month
  if (route.query.categoryId) filterCategoryId.value = route.query.categoryId
  await useFamilyGuard()
  if (accountingStore.currentBookId) {
    loadCategories()
    loadData()
  }
})

watch(() => accountingStore.currentBookId, (id) => {
  if (id) loadData()
})

async function loadData() {
  if (!accountingStore.currentBookId) return
  loading.value = true
  try {
    const [year, month] = currentMonth.value.split('-')
    // 并行加载交易列表和月度汇总
    const [txnsRes, reportRes] = await Promise.all([
      accountingApi.getTransactions({
        bookId: accountingStore.currentBookId,
        startDate: currentMonth.value + '-01',
        endDate: dayjs(currentMonth.value + '-01').endOf('month').format('YYYY-MM-DD'),
        categoryId: filterCategoryId.value || undefined,
        type: filterType.value || undefined,
        search: searchKeyword.value || undefined,
        page: currentPage.value,
        pageSize: 20
      }),
      accountingApi.getMonthlyReport({
        bookId: accountingStore.currentBookId,
        year, month
      })
    ])
    transactions.value = txnsRes.data.list
    totalTxns.value = txnsRes.data.total
    summary.income = reportRes.data.income || 0
    summary.expense = reportRes.data.expense || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  min-width: 90px;
  text-align: center;
}

/* 筛选栏 */
/* 筛选栏 */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.filter-search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 14px;
  transition: all 0.2s;
}
.filter-search-wrap:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
.filter-search-icon {
  color: #94a3b8;
  flex-shrink: 0;
  font-size: 18px;
}
.filter-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  padding: 10px 0;
  line-height: 1.5;
}
.filter-search-input::placeholder {
  color: #94a3b8;
}
.filter-search-clear {
  width: 24px;
  height: 24px;
  border: none;
  background: #f1f5f9;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.filter-search-clear:hover {
  background: #e2e8f0;
  color: #64748b;
}
.filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-chip {
  padding: 6px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.filter-chip:hover {
  border-color: #cbd5e1;
  color: #475569;
}
.filter-chip.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
.filter-chip.expense.active {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.filter-chip.income.active {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
/* 分类选择器 */
.filter-cat-wrap {
  position: relative;
}
.cat-chip {
  display: flex;
  align-items: center;
  gap: 4px;
}
.cat-chip-arrow {
  font-size: 12px;
  transition: transform 0.2s;
}
.cat-chip.active .cat-chip-arrow {
  transform: rotate(180deg);
}
.cat-chip-clear {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.cat-chip-clear:hover {
  background: rgba(255, 255, 255, 0.5);
}
.cat-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  max-height: 360px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cat-dropdown-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #94a3b8;
}
.cat-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1e293b;
}
.cat-search-input::placeholder {
  color: #94a3b8;
}
.cat-dropdown-list {
  overflow-y: auto;
  padding: 6px;
}
.cat-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.cat-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
  color: #475569;
}
.cat-dropdown-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.cat-dropdown-item.active {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  font-weight: 500;
}
.cat-dropdown-item.all {
  color: #64748b;
  font-weight: 500;
}
.cat-item-icon {
  font-size: 15px;
  flex-shrink: 0;
}
.cat-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cat-item-check {
  color: #667eea;
  font-size: 14px;
  flex-shrink: 0;
}
.cat-dropdown-empty {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* 下拉动画 */
.cat-dropdown-enter-active,
.cat-dropdown-leave-active {
  transition: all 0.2s ease;
}
.cat-dropdown-enter-from,
.cat-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 统计 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.summary-item {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 18px 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.sum-label {
  font-size: 13px;
  color: #94a3b8;
  display: block;
  margin-bottom: 6px;
}
.sum-val {
  font-size: 24px;
  font-weight: 700;
}
.sum-val.income { color: #34d399; }
.sum-val.expense { color: #f87171; }
.sum-val.balance { color: #667eea; }

/* 账单卡片 */
.txn-card {
  padding: 0;
  overflow: hidden;
}

.loading-state {
  text-align: center;
  padding: 40px;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-state p {
  margin-top: 12px;
  color: #94a3b8;
  font-size: 14px;
}

/* 分组 */
.txn-group {
  border-bottom: 1px solid #f1f5f9;
}
.txn-group:last-child {
  border-bottom: none;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px 10px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
}
.group-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-date {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
.group-right {
  display: flex;
  gap: 16px;
  font-size: 13px;
}
.group-income { color: #34d399; }
.group-expense { color: #f87171; }

/* 交易行 */
.txn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  transition: background 0.2s;
}
.txn-row:hover {
  background: rgba(102, 126, 234, 0.03);
}

.txn-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.txn-note {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.txn-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.txn-amount {
  font-size: 16px;
  font-weight: 700;
  min-width: 90px;
  text-align: right;
}
.txn-amount.income { color: #34d399; }
.txn-amount.expense { color: #f87171; }

/* 操作按钮 */
.txn-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.txn-row:hover .txn-actions {
  opacity: 1;
}
.act-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
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
  .summary-row {
    grid-template-columns: 1fr;
  }
  .txn-actions {
    opacity: 1;
  }
  .filter-bar {
    gap: 10px;
  }
  .filter-search-wrap {
    padding: 0 12px;
  }
  .filter-search-input {
    font-size: 16px; /* 防止 iOS 缩放 */
    padding: 9px 0;
  }
  .filter-chips {
    gap: 6px;
  }
  .filter-chip {
    padding: 5px 12px;
    font-size: 12px;
  }
  .cat-dropdown {
    min-width: 200px;
    max-height: 300px;
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

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0 0;
}
</style>

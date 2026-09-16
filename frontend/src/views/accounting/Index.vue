<template>
  <div class="accounting-page">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div>
        <div class="page-title">🪙 小家账本</div>
        <div class="page-sub">每一笔收支，都是认真生活的痕迹</div>
      </div>
      <div class="head-actions">
        <div class="month-nav">
          <button class="mn-btn" @click="changeMonth(-1)">‹</button>
          <span class="mn-label">{{ monthLabel }}</span>
          <button class="mn-btn" @click="changeMonth(1)">›</button>
        </div>
        <button class="btn ghost" @click="$router.push('/accounting/recurring')">⏰ 定时记账</button>
        <button class="btn primary" @click="showCreate = true">✏️ 记一笔</button>
      </div>
    </div>

    <!-- 子页签 -->
    <div class="subtabs reveal">
      <button class="subtab" :class="{ active: activeTab === 'flow' }" @click="switchTab('flow')">📃 流水账单</button>
      <button class="subtab" :class="{ active: activeTab === 'budget' }" @click="switchTab('budget')">🎯 预算管理</button>
      <button class="subtab" :class="{ active: activeTab === 'report' }" @click="switchTab('report')">📊 报表分析</button>
      <button class="subtab" :class="{ active: activeTab === 'import' }" @click="switchTab('import')">📥 账单导入</button>
      <button class="subtab" :class="{ active: activeTab === 'books' }" @click="switchTab('books')">📚 账本管理</button>
    </div>

    <!-- ========== 流水账单 ========== -->
    <div v-if="activeTab === 'flow'">
      <!-- 汇总 -->
      <div class="summary">
        <div class="sum-card income reveal">
          <span class="sum-label"><span class="sum-ico g-sage">📈</span>本月收入</span>
          <span class="sum-val income">¥{{ formatMoney(flowSummary.income) }}</span>
        </div>
        <div class="sum-card expense reveal">
          <span class="sum-label"><span class="sum-ico g-rose">📉</span>本月支出</span>
          <span class="sum-val expense">¥{{ formatMoney(flowSummary.expense) }}</span>
        </div>
        <div class="sum-card balance reveal">
          <span class="sum-label"><span class="sum-ico g-amber">💰</span>本月结余</span>
          <span class="sum-val balance">¥{{ formatMoney(flowSummary.income - flowSummary.expense) }}</span>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar reveal">
        <div class="search-wrap"><span class="mag">🔍</span>
          <input class="search-input" v-model="searchKeyword" placeholder="搜索备注、分类..." @keyup.enter="handleFilter" />
        </div>
        <div class="chips">
          <button class="chip-btn" :class="{ active: filterType === '' }" @click="filterType = ''; handleFilter()">全部</button>
          <button class="chip-btn" :class="{ active: filterType === 'expense', exp: filterType === 'expense' }" @click="filterType = 'expense'; handleFilter()">📉 支出</button>
          <button class="chip-btn" :class="{ active: filterType === 'income', inc: filterType === 'income' }" @click="filterType = 'income'; handleFilter()">📈 收入</button>
          <button class="chip-btn" @click="$router.push('/accounting/categories')">📂 分类管理</button>
          <button v-if="filterCategoryId" class="chip-btn active cat-filter" @click="filterCategoryId = null; filterCategoryName = ''; handleFilter()">📌 {{ filterCategoryName }} ✕</button>
        </div>
      </div>

      <!-- 账单列表 -->
      <div class="card reveal">
        <div v-if="flowLoading" class="card-empty"><el-icon class="is-loading" :size="24"><Loading /></el-icon></div>
        <div v-else-if="groupedTxns.length === 0" class="card-empty"><span>📝</span><span>暂无账单记录</span></div>
        <template v-else>
          <div v-for="group in groupedTxns" :key="group.date" class="group">
            <div class="group-head">
              <div class="g-date">{{ formatGroupDate(group.date) }} <span class="g-count">{{ group.items.length }} 笔</span></div>
              <div class="g-sum"><span class="gi">收 +{{ formatMoney(group.income) }}</span><span class="ge">支 -{{ formatMoney(group.expense) }}</span></div>
            </div>
            <div v-for="t in group.items" :key="t.id" class="row">
              <div class="row-ico" :class="getIconClass(t)">{{ getCategoryIcon(t) }}</div>
              <div class="row-body">
                <div class="row-cat">{{ t.Category?.name || '未分类' }}</div>
                <div class="row-note">{{ t.note || (t.type === 'income' ? '收入' : '支出') }}</div>
              </div>
              <div class="row-amt" :class="t.type">{{ t.type === 'income' ? '+' : '-' }}¥{{ parseFloat(t.amount).toFixed(2) }}</div>
              <div class="row-acts">
                <button class="act" @click="openEdit(t)">✎</button>
                <el-popconfirm title="确定删除这条记录？" @confirm="handleDelete(t.id)">
                  <template #reference><button class="act danger">🗑</button></template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </template>
        <div v-if="totalTxns > 20" class="pagination-wrap">
          <el-pagination layout="prev, pager, next" :total="totalTxns" :page-size="20" :current-page="currentPage" @current-change="p => { currentPage = p; loadTransactions() }" />
        </div>
      </div>
    </div>

    <!-- ========== 预算管理 ========== -->
    <div v-if="activeTab === 'budget'">
      <div class="card budget-total reveal">
        <div class="bt-head">
          <div class="bt-title">{{ monthLabel }}总预算</div>
          <div class="bt-num">已用 <b>¥{{ formatMoney(budgetTotalSpent) }}</b> / ¥{{ formatMoney(budgetTotalAmount) }}</div>
        </div>
        <div class="bar" :class="budgetBarClass"><i :style="{ width: budgetPercent + '%' }"></i></div>
        <div class="b-nums"><span>{{ budgetPercent }}% · {{ budgetStatusText }}</span><span>剩余 ¥{{ formatMoney(Math.max(0, budgetTotalAmount - budgetTotalSpent)) }}</span></div>
      </div>
      <div class="budget-head-actions reveal">
        <button class="btn primary" @click="openBudgetCreate">✏️ 设置预算</button>
      </div>
      <div v-if="budgetLoading" class="card card-empty"><el-icon class="is-loading" :size="24"><Loading /></el-icon></div>
      <div v-else-if="budgets.length === 0" class="card card-empty"><span>🎯</span><span>还没有预算，点击上方设置</span></div>
      <div v-else class="budget-grid">
        <div v-for="b in budgets" :key="b.id" class="card b-card reveal">
          <div class="b-top">
            <div class="b-ico" :class="getBudgetIconClass(b)">{{ getBudgetIcon(b) }}</div>
            <div class="b-name">{{ b.Category?.name || '总预算' }}</div>
            <div class="b-pct" :style="{ color: b.percent > 90 ? 'var(--rose-d)' : b.percent > 70 ? 'var(--amber-d)' : 'var(--sage-d)' }">{{ b.percent }}%</div>
          </div>
          <div class="bar" :class="b.percent > 90 ? 'over' : b.percent > 70 ? 'warn' : 'ok'"><i :style="{ width: b.percent + '%' }"></i></div>
          <div class="b-nums"><span>¥{{ formatMoney(b.spent) }} / ¥{{ formatMoney(b.amount) }}</span><span v-if="b.percent > 90">⚠ 接近上限</span><span v-else>剩余 ¥{{ formatMoney(Math.max(0, b.amount - b.spent)) }}</span></div>
          <div class="b-card-actions">
            <button class="act" @click="openBudgetEdit(b)">✎</button>
            <el-popconfirm title="确定删除此预算？" @confirm="handleBudgetDelete(b.id)">
              <template #reference><button class="act danger">🗑</button></template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 账单导入 ========== -->
    <div v-if="activeTab === 'import'">
      <BillImport :book-id="accountingStore.currentBookId" @imported="onImported" />
    </div>

    <!-- ========== 账本管理 ========== -->
    <div v-if="activeTab === 'books'">
      <div class="books-grid">
        <div v-for="b in booksList" :key="b.id" class="card book reveal" :class="{ current: b.id === accountingStore.currentBookId }" @click="selectBook(b)">
          <div class="book-top">
            <div class="book-ico" :class="getBookIconClass(b)">{{ getBookIcon(b) }}</div>
            <span v-if="b.id === accountingStore.currentBookId" class="book-cur">当前使用</span>
            <el-dropdown v-else trigger="click" @command="(cmd) => handleBookCmd(cmd, b)" @click.stop>
              <button class="book-more" @click.stop>⋯</button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete"><span style="color:var(--rose-d);">删除账本</span></el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="book-name">{{ b.name }}</div>
          <div class="book-desc">{{ b.description || '暂无描述' }}</div>
          <div class="book-foot"><span class="tag" :class="b.type">{{ b.type === 'family' ? '家庭共享' : '个人私密' }}</span></div>
        </div>
        <div class="card book-add reveal" @click="showBookCreate = true"><span class="plus">＋</span>新建账本</div>
      </div>
    </div>

    <!-- 弹窗：记账 -->
    <el-dialog v-model="showCreate" :width="quickAddMode === 'batch' ? '520px' : '440px'" top="10vh" destroy-on-close :lock-scroll="false" append-to-body class="warm-dialog">
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">记账</span>
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: quickAddMode === 'single' }" @click="quickAddMode = 'single'">单笔</button>
            <button class="mode-btn" :class="{ active: quickAddMode === 'batch' }" @click="quickAddMode = 'batch'">批量</button>
          </div>
        </div>
      </template>
      <TransactionForm v-if="quickAddMode === 'single'" @success="onTxnSuccess" />
      <BatchTransactionForm v-else @success="onTxnSuccess" />
    </el-dialog>

    <!-- 弹窗：编辑 -->
    <el-dialog v-model="showEdit" title="编辑账单" width="440px" top="10vh" destroy-on-close append-to-body class="warm-dialog">
      <TransactionForm :edit-data="editTarget" @success="showEdit = false; loadTransactions()" />
    </el-dialog>

    <!-- 弹窗：预算 -->
    <el-dialog v-model="showBudgetDialog" :title="isBudgetEdit ? '编辑预算' : '设置预算'" width="420px" destroy-on-close append-to-body class="warm-dialog">
      <el-form :model="budgetForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="budgetForm.categoryId" placeholder="选择分类(不选为总预算)" style="width:100%" clearable filterable :disabled="isBudgetEdit">
            <template v-for="group in budgetCategories" :key="group.id">
              <el-option-group v-if="group.children?.length" :label="group.name">
                <el-option
                  v-for="child in group.children"
                  :key="child.id"
                  :label="`${group.name} / ${child.name}`"
                  :value="child.id"
                >
                  <span style="display:flex;align-items:center;gap:6px;">
                    <span style="color:var(--text-muted);font-size:12px;">{{ group.name }}</span>
                    <span>{{ child.name }}</span>
                  </span>
                </el-option>
              </el-option-group>
              <el-option v-else :key="group.id" :label="group.name" :value="group.id" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input v-model="budgetForm.amount" type="number" placeholder="输入预算金额"><template #append>¥</template></el-input>
        </el-form-item>
        <el-form-item label="预警">
          <el-slider v-model="budgetForm.warnPercent" :min="50" :max="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBudgetDialog = false">取消</el-button>
        <el-button type="primary" :loading="budgetSaving" @click="handleBudgetSave">{{ isBudgetEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：新建账本 -->
    <el-dialog v-model="showBookCreate" title="新建账本" width="440px" destroy-on-close append-to-body class="warm-dialog">
      <el-form :model="bookForm" label-width="80px">
        <el-form-item label="账本名称"><el-input v-model="bookForm.name" placeholder="如：家庭生活、旅行基金" /></el-form-item>
        <el-form-item label="账本类型">
          <el-radio-group v-model="bookForm.type"><el-radio value="family">家庭共享</el-radio><el-radio value="personal">个人私密</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="bookForm.description" type="textarea" :rows="2" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBookCreate = false">取消</el-button>
        <el-button type="primary" :loading="bookSaving" @click="handleBookCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 删除账本确认 -->
    <el-dialog v-model="showBookDelete" title="删除账本" width="440px" destroy-on-close append-to-body class="warm-dialog">
      <div class="delete-warn">
        <div class="warn-icon">⚠️</div>
        <div class="warn-body">
          <div class="warn-title">确定要删除账本「{{ deleteBookTarget?.name }}」吗？</div>
          <div class="warn-detail">删除后将同时清除关联的预算和周期性账单，此操作不可撤销。</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBookDelete = false">取消</el-button>
        <el-button type="danger" :loading="bookDeleting" @click="confirmBookDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import { useAuthStore } from '@/store/auth'
import TransactionForm from '@/components/accounting/TransactionForm.vue'
import BatchTransactionForm from '@/components/accounting/BatchTransactionForm.vue'
import BillImport from '@/components/accounting/BillImport.vue'
import { ElMessage } from 'element-plus'
import { formatMoney } from '@/utils/format'
import { buildCategoryTree } from '@/utils/categoryTree'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const accountingStore = useAccountingStore()

// ===== 通用 =====
const currentMonth = ref(dayjs().format('YYYY-MM'))
const activeTab = ref('flow')
const quickAddMode = ref('single')

const monthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-')
  return `${y}年${parseInt(m)}月`
})

function changeMonth(delta) {
  currentMonth.value = dayjs(currentMonth.value + '-01').add(delta, 'month').format('YYYY-MM')
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'flow') loadTransactions().then(() => observeReveal())
  else if (tab === 'budget') loadBudgets().then(() => observeReveal())
  else if (tab === 'report') router.push('/accounting/report')
  else if (tab === 'books') loadBooks().then(() => observeReveal())
  else nextTick(() => observeReveal())
}

// ===== 流水账单 =====
const transactions = ref([])
const flowSummary = reactive({ income: 0, expense: 0 })
const flowLoading = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const showCreate = ref(false)
const showEdit = ref(false)
const editTarget = ref(null)
const currentPage = ref(1)
const totalTxns = ref(0)

const groupedTxns = computed(() => {
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

function formatGroupDate(d) {
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  if (d === today) return dayjs(d).format('M月D日') + ' · 今天'
  if (d === yesterday) return dayjs(d).format('M月D日') + ' · 昨天'
  return dayjs(d).format('M月D日')
}

function getCategoryIcon(t) {
  const name = t.Category?.name || ''
  if (name.includes('超市') || name.includes('购物') || name.includes('买')) return '🛒'
  if (name.includes('餐') || name.includes('吃') || name.includes('外卖')) return '🍚'
  if (name.includes('交通') || name.includes('加油')) return '⛽'
  if (name.includes('咖啡') || name.includes('茶')) return '☕'
  if (name.includes('工资') || name.includes('薪')) return '💼'
  if (name.includes('宝宝') || name.includes('玩具')) return '🧸'
  if (name.includes('房租') || name.includes('物业')) return '🏠'
  if (name.includes('医疗') || name.includes('药')) return '💊'
  if (name.includes('买菜') || name.includes('蔬')) return '🥬'
  if (t.type === 'income') return '💼'
  return '💰'
}

function getIconClass(t) {
  const idx = (t.id || 0) % 5
  return ['g-terra', 'g-rose', 'g-sage', 'g-amber', 'g-sky'][idx]
}

function handleFilter() { currentPage.value = 1; loadTransactions() }

function openEdit(t) { editTarget.value = { ...t }; showEdit.value = true }
function onTxnSuccess() { showCreate.value = false; loadTransactions() }
function onImported() { switchTab('flow') }

async function handleDelete(id) {
  try { await accountingApi.deleteTransaction(id); ElMessage.success('已删除'); loadTransactions() } catch (e) { console.error(e) }
}

async function loadTransactions() {
  if (!accountingStore.currentBookId) return
  flowLoading.value = true
  try {
    const [txnsRes, reportRes] = await Promise.all([
      accountingApi.getTransactions({
        bookId: accountingStore.currentBookId,
        startDate: currentMonth.value + '-01',
        endDate: dayjs(currentMonth.value + '-01').endOf('month').format('YYYY-MM-DD'),
        type: filterType.value || undefined,
        search: searchKeyword.value || undefined,
        categoryId: filterCategoryId.value || undefined,
        page: currentPage.value,
        pageSize: 20
      }),
      accountingApi.getMonthlyReport({
        bookId: accountingStore.currentBookId,
        year: currentMonth.value.split('-')[0],
        month: currentMonth.value.split('-')[1]
      })
    ])
    transactions.value = txnsRes.data.list || []
    totalTxns.value = txnsRes.data.total || 0
    flowSummary.income = reportRes.data.income || 0
    flowSummary.expense = reportRes.data.expense || 0
  } catch (e) { console.error(e) }
  finally { flowLoading.value = false }
}

// ===== 预算管理 =====
const budgets = ref([])
const budgetCategories = ref([])
const budgetLoading = ref(false)
const showBudgetDialog = ref(false)
const isBudgetEdit = ref(false)
const budgetEditId = ref(null)
const budgetSaving = ref(false)
const budgetForm = reactive({ categoryId: null, amount: '', warnPercent: 80 })

const budgetTotalAmount = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.amount || 0), 0))
const budgetTotalSpent = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.spent || 0), 0))
const budgetPercent = computed(() => budgetTotalAmount.value > 0 ? Math.round((budgetTotalSpent.value / budgetTotalAmount.value) * 100) : 0)
const budgetBarClass = computed(() => budgetPercent.value > 90 ? 'over' : budgetPercent.value > 70 ? 'warn' : 'ok')
const budgetStatusText = computed(() => budgetPercent.value > 90 ? '已超支' : budgetPercent.value > 70 ? '进度良好' : '健康')

function getBudgetIcon(b) {
  const name = b.Category?.name || ''
  if (name.includes('餐') || name.includes('吃')) return '🍚'
  if (name.includes('住') || name.includes('物业')) return '🏠'
  if (name.includes('交通') || name.includes('出行')) return '🚗'
  if (name.includes('购物')) return '🛍'
  if (name.includes('宝宝') || name.includes('成长')) return '🧸'
  if (name.includes('人情') || name.includes('礼物')) return '🎁'
  return '💰'
}

function getBudgetIconClass(b) {
  const idx = (b.id || 0) % 5
  return ['g-terra', 'g-sky', 'g-amber', 'g-rose', 'g-plum'][idx]
}

function openBudgetCreate() {
  isBudgetEdit.value = false; budgetEditId.value = null
  budgetForm.categoryId = null; budgetForm.amount = ''; budgetForm.warnPercent = 80
  showBudgetDialog.value = true
}

function openBudgetEdit(b) {
  isBudgetEdit.value = true; budgetEditId.value = b.id
  budgetForm.categoryId = b.categoryId; budgetForm.amount = b.amount; budgetForm.warnPercent = b.warnPercent || 80
  showBudgetDialog.value = true
}

async function handleBudgetSave() {
  if (!budgetForm.amount) return ElMessage.warning('请输入预算金额')
  budgetSaving.value = true
  try {
    await accountingApi.setBudget({ bookId: accountingStore.currentBookId, ...budgetForm })
    ElMessage.success(isBudgetEdit.value ? '预算更新成功' : '预算设置成功')
    showBudgetDialog.value = false; loadBudgets()
  } catch (e) { console.error(e) }
  finally { budgetSaving.value = false }
}

async function handleBudgetDelete(id) {
  try { await accountingApi.deleteBudget(id); ElMessage.success('预算已删除'); loadBudgets() } catch (e) { console.error(e) }
}

async function loadBudgets() {
  if (!accountingStore.currentBookId) return
  budgetLoading.value = true
  try {
    const res = await accountingApi.getBudgets({ bookId: accountingStore.currentBookId, month: currentMonth.value })
    budgets.value = res.data || []
    // 加载分类（树形）
    if (budgetCategories.value.length === 0) {
      const catRes = await accountingApi.getCategories({ type: 'expense', familyId: authStore.currentFamily?.id })
      budgetCategories.value = buildCategoryTree(catRes.data || [], 'expense')
    }
  } catch (e) { console.error(e) }
  finally { budgetLoading.value = false }
}

// ===== 账本管理 =====
const booksList = ref([])
const showBookCreate = ref(false)
const bookSaving = ref(false)
const bookForm = ref({ name: '', type: 'family', description: '' })
const showBookDelete = ref(false)
const deleteBookTarget = ref(null)
const bookDeleting = ref(false)

function getBookIcon(b) {
  if (b.name?.includes('旅行') || b.name?.includes('旅')) return '✈️'
  if (b.name?.includes('私') || b.name?.includes('个人')) return '💄'
  return '🏡'
}

function getBookIconClass(b) {
  return b.type === 'family' ? 'g-terra' : 'g-plum'
}

function selectBook(b) {
  accountingStore.setCurrentBookId(b.id)
  activeTab.value = 'flow'
  loadTransactions()
}

function handleBookCmd(cmd, b) {
  if (cmd === 'delete') { deleteBookTarget.value = b; showBookDelete.value = true }
}

async function handleBookCreate() {
  if (!bookForm.value.name) return ElMessage.warning('请输入账本名称')
  bookSaving.value = true
  try {
    await accountingApi.createBook({ ...bookForm.value, familyId: authStore.currentFamily?.id })
    ElMessage.success('创建成功'); showBookCreate.value = false
    bookForm.value = { name: '', type: 'family', description: '' }
    loadBooks()
  } catch (e) { console.error(e) }
  finally { bookSaving.value = false }
}

async function confirmBookDelete() {
  bookDeleting.value = true
  try {
    await accountingApi.deleteBook(deleteBookTarget.value.id, true)
    ElMessage.success('账本已删除'); showBookDelete.value = false; loadBooks()
  } catch { ElMessage.error('删除失败') }
  finally { bookDeleting.value = false }
}

async function loadBooks() {
  try {
    const familyId = authStore.currentFamily?.id
    if (!familyId) return
    const res = await accountingApi.getBooks({ familyId })
    const list = res.data || []
    booksList.value = list
    accountingStore.books = [...list]
    // 同步 currentBookId
    if (list.length && !list.find(b => String(b.id) === String(accountingStore.currentBookId))) {
      accountingStore.setCurrentBookId(list[0].id)
    }
  } catch (e) { console.error(e) }
}

// ===== 滚动渐入 =====
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
    document.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
      if (!el.dataset.d) el.dataset.d = (i % 6) * 60
      el.style.transitionDelay = el.dataset.d + 'ms'
      revealIO.observe(el)
    })
  })
}

// ===== 生命周期 =====
watch(() => accountingStore.currentBookId, (id) => {
  if (id && activeTab.value === 'flow') loadTransactions()
})

watch(currentMonth, () => {
  if (activeTab.value === 'flow') loadTransactions()
  else if (activeTab.value === 'budget') loadBudgets()
})

const filterCategoryId = ref(null)
const filterCategoryName = ref('')

onMounted(async () => {
  if (!await useFamilyGuard()) return
  if (route.query.month) currentMonth.value = route.query.month
  if (route.query.categoryId) {
    filterCategoryId.value = route.query.categoryId
    filterCategoryName.value = route.query.categoryName || ''
    activeTab.value = 'flow'
  }
  // 并行加载，不互相阻塞
  if (accountingStore.currentBookId) loadTransactions()
  loadBooks()
  observeReveal()
})
</script>

<style scoped>
.accounting-page { position: relative; }

/* ===== 页头 ===== */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.page-title { font-size: 26px; font-weight: 800; letter-spacing: 0.02em; color: var(--terra-deep); display: flex; align-items: center; gap: 10px; }
.page-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-secondary); }
.head-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.3s, box-shadow 0.3s; }
.btn.primary { background: var(--gradient-primary); color: var(--bg-card); box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.4); }
.btn.ghost { background: rgba(var(--bg-card-rgb), 0.85); color: var(--terra-deep); border: 1.5px solid var(--border); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(var(--primary-rgb), 0.3); }
.btn:active { transform: translateY(-1px) scale(0.98); }

/* 月份切换 */
.month-nav { display: flex; align-items: center; gap: 6px; background: rgba(var(--bg-card-rgb), 0.85); border: 1.5px solid var(--border); border-radius: 13px; padding: 4px; }
.mn-btn { width: 32px; height: 32px; border-radius: 9px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 15px; transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
.mn-btn:hover { background: rgba(var(--primary-rgb), 0.14); color: var(--terra-deep); }
.mn-label { min-width: 96px; text-align: center; font-size: 14px; font-weight: 600; color: var(--terra-deep); }

/* ===== 子页签 ===== */
.subtabs { display: flex; gap: 6px; background: rgba(var(--cream-rgb), 0.6); border: 1px solid var(--border); padding: 5px; border-radius: 16px; margin-bottom: 22px; overflow-x: auto; }
.subtab { padding: 10px 18px; border-radius: 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.3s; display: flex; align-items: center; gap: 7px; }
.subtab:hover { color: var(--terra-deep); }
.subtab.active { background: var(--bg-card); color: var(--terra-deep); box-shadow: 0 4px 14px rgba(var(--shadow-rgb), 0.14); }

/* ===== 汇总 ===== */
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.sum-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; position: relative; overflow: hidden; box-shadow: var(--shadow-md); transition: transform 0.35s, box-shadow 0.35s; }
.sum-card:hover { transform: translateY(-5px); box-shadow: 0 16px 38px rgba(var(--shadow-rgb), 0.15); }
.sum-card::after { content: ""; position: absolute; right: -30px; top: -30px; width: 110px; height: 110px; border-radius: 50%; opacity: 0.14; }
.sum-card.income::after { background: var(--sage); }
.sum-card.expense::after { background: var(--rose); }
.sum-card.balance::after { background: var(--amber); }
.sum-label { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 7px; }
.sum-ico { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff; }
.sum-val { display: block; margin-top: 10px; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.sum-val.income { color: var(--sage-d); }
.sum-val.expense { color: var(--rose-d); }
.sum-val.balance { color: var(--terra-deep); }

/* ===== 筛选 ===== */
.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
.search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 340px; }
.search-wrap .mag { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; opacity: 0.6; }
.search-input { width: 100%; padding: 12px 14px 12px 40px; border-radius: 13px; border: 1.5px solid var(--wood-light); background: var(--bg-card); font-size: 14px; color: var(--text-primary); transition: all 0.3s; outline: none; }
.search-input:focus { border-color: var(--terracotta); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.14); }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip-btn { padding: 10px 16px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(var(--bg-card-rgb), 0.8); color: var(--text-secondary); font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.chip-btn:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.chip-btn.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.35); }
.chip-btn.active.exp { background: var(--rose); border-color: var(--rose); }
.chip-btn.active.inc { background: var(--sage); border-color: var(--sage); }

/* ===== 列表 ===== */
.card-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 32px 16px; color: var(--text-secondary); font-size: 13px; }
.group { padding: 6px 22px 14px; }
.group + .group { border-top: 1px dashed var(--border); }
.group-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 8px; }
.g-date { font-size: 14px; font-weight: 700; color: var(--terra-deep); display: flex; align-items: center; gap: 9px; }
.g-count { font-size: 11px; font-weight: 600; color: var(--text-secondary); background: var(--apricot); padding: 2px 9px; border-radius: 999px; }
.g-sum { display: flex; gap: 14px; font-size: 12.5px; font-weight: 600; }
.g-sum .gi { color: var(--sage-d); }
.g-sum .ge { color: var(--rose-d); }
.row { display: flex; align-items: center; gap: 13px; padding: 12px 0; border-top: 1px dashed var(--border-light); transition: background 0.25s, padding 0.25s; border-radius: 8px; }
.row:hover { background: rgba(var(--cream-rgb), 0.5); padding-left: 8px; padding-right: 8px; }
.row-ico { width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.row-body { flex: 1; min-width: 0; }
.row-cat { font-size: 14.5px; font-weight: 600; color: var(--text-primary); }
.row-note { font-size: 12px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-amt { font-size: 16px; font-weight: 700; flex-shrink: 0; }
.row-amt.out { color: var(--rose-d); }
.row-amt.in { color: var(--sage-d); }
.row-acts { display: flex; gap: 6px; opacity: 0; transition: opacity 0.25s; }
.row:hover .row-acts { opacity: 1; }
.act { width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(var(--primary-rgb), 0.12); color: var(--terra-deep); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.act:hover { background: rgba(var(--primary-rgb), 0.28); }
.act.danger:hover { background: rgba(var(--rose-rgb), 0.3); color: var(--rose-d); }
.g-terra { background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); }
.g-rose { background: linear-gradient(135deg, var(--rose), var(--rose)); }
.g-sage { background: linear-gradient(135deg, var(--sage), var(--sage)); }
.g-amber { background: linear-gradient(135deg, var(--amber), var(--amber)); }
.g-sky { background: linear-gradient(135deg, var(--sky), var(--sky)); }
.g-plum { background: linear-gradient(135deg, var(--plum), var(--plum)); }

/* ===== 预算 ===== */
.budget-total { margin-bottom: 18px; }
.bt-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bt-title { font-size: 16px; font-weight: 700; }
.bt-num { font-size: 14px; color: var(--text-secondary); }
.bt-num b { color: var(--terra-deep); font-size: 17px; }
.bar { height: 12px; border-radius: 6px; background: var(--apricot); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: 6px; width: 0; transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1); }
.bar.ok i { background: linear-gradient(90deg, var(--sage), var(--sage-d)); }
.bar.warn i { background: linear-gradient(90deg, var(--amber), var(--amber-d)); }
.bar.over i { background: linear-gradient(90deg, var(--rose), var(--rose-d)); }
.b-nums { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-secondary); margin-top: 9px; }
.budget-head-actions { display: flex; gap: 10px; margin-bottom: 18px; }
.budget-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.b-card { position: relative; transition: transform 0.35s, box-shadow 0.35s; }
.b-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(var(--shadow-rgb), 0.15); }
.b-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.b-ico { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
.b-name { font-size: 15px; font-weight: 700; }
.b-pct { margin-left: auto; font-size: 15px; font-weight: 800; }
.b-card-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.b-card:hover .b-card-actions { opacity: 1; }

/* ===== 分类筛选 ===== */
.cat-filter { background: rgba(var(--primary-rgb), 0.18) !important; border-color: var(--terracotta) !important; color: var(--terra-deep) !important; }

/* ===== 账本 ===== */
.books-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.book { cursor: pointer; position: relative; overflow: hidden; transition: transform 0.35s, box-shadow 0.35s; }
.book:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(var(--shadow-rgb), 0.16); }
.book.current { border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.18), 0 12px 30px rgba(var(--shadow-rgb), 0.14); }
.book-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.book-ico { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 25px; color: #fff; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.book:hover .book-ico { transform: scale(1.1) rotate(-6deg); }
.book-cur { font-size: 11px; font-weight: 700; color: #fff; background: var(--terracotta); padding: 3px 10px; border-radius: 999px; }
.book-more { width: 28px; height: 28px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 18px; color: var(--text-secondary); transition: all 0.2s; }
.book-more:hover { background: rgba(var(--primary-rgb), 0.1); }
.book-name { font-size: 18px; font-weight: 700; }
.book-desc { font-size: 13px; color: var(--text-secondary); margin: 6px 0 14px; line-height: 1.5; }
.book-foot { display: flex; align-items: center; gap: 8px; }
.tag { font-size: 12px; font-weight: 600; padding: 4px 11px; border-radius: 999px; }
.tag.family { background: rgba(var(--primary-rgb), 0.16); color: var(--terra-deep); }
.tag.personal { background: rgba(var(--sage-rgb), 0.18); color: var(--sage-d); }
.book-add { border: 2px dashed var(--wood-light); background: rgba(var(--cream-rgb), 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 170px; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.book-add:hover { border-color: var(--terracotta); color: var(--terra-deep); background: rgba(var(--cream-rgb), 0.8); transform: translateY(-4px); }
.book-add .plus { font-size: 30px; line-height: 1; }

.dialog-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.dialog-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.mode-toggle { display: flex; gap: 4px; background: var(--apricot); border-radius: 10px; padding: 3px; }
.mode-btn { padding: 6px 14px; border: none; border-radius: 8px; background: transparent; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: #fff; color: var(--terra-deep); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }

/* 删除警告 */
.delete-warn { display: flex; gap: 14px; padding: 16px; background: rgba(var(--rose-rgb), 0.1); border-radius: 12px; border: 1px solid rgba(var(--rose-rgb), 0.3); }
.warn-icon { font-size: 28px; flex-shrink: 0; }
.warn-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.warn-detail { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

/* 分页 */
.pagination-wrap { display: flex; justify-content: center; padding: 16px 0 0; }

/* ===== 渐入 ===== */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.reveal.in { opacity: 1; transform: none; }

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .summary { grid-template-columns: 1fr; }
  .budget-grid, .books-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .page-head { flex-direction: column; align-items: flex-start; }
  .head-actions { width: 100%; flex-wrap: wrap; }
  .page-title { font-size: 22px; }
  .sum-val { font-size: 26px; }
  .budget-grid, .books-grid { grid-template-columns: 1fr; }
  .row-acts { opacity: 1; }
  .act { width: 36px; height: 36px; font-size: 15px; }
  .b-card-actions { opacity: 1; }
  .book-more { width: 36px; height: 36px; }
  .mn-btn { width: 40px; height: 40px; }
  .group { padding: 4px 16px 10px; }
}
</style>

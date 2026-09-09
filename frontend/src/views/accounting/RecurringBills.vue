<template>
  <div class="recurring-page">
    <div class="page-header">
      <div>
        <div class="page-title">定时记账</div>
        <p class="page-desc">设置自动执行的记账任务，系统会按计划为您自动创建交易记录</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新建任务
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" v-if="!loading && bills.length > 0">
      <div class="mini-stat">
        <span class="ms-num">{{ bills.length }}</span>
        <span class="ms-lbl">总任务</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num active">{{ activeCount }}</span>
        <span class="ms-lbl">运行中</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num">{{ totalRuns }}</span>
        <span class="ms-lbl">累计执行</span>
      </div>
    </div>

    <!-- 任务列表 -->
    <div v-if="bills.length === 0" class="empty-card card">
      <el-icon :size="56" color="#E2CDB2"><Timer /></el-icon>
      <p class="empty-title">暂无定时任务</p>
      <p class="empty-desc">创建定时记账任务，让物业费、工资、订阅等固定收支自动入账</p>
      <el-button type="primary" @click="openCreate" style="margin-top:12px;">
        <el-icon><Plus /></el-icon>创建第一个任务
      </el-button>
    </div>

    <div v-else class="bill-list">
      <div v-for="bill in bills" :key="bill.id" class="bill-card card" :class="{ paused: !bill.active }">
        <div class="bill-left">
          <div class="bill-icon" :class="bill.type">
            <el-icon :size="20">
              <component :is="bill.type === 'income' ? 'TrendCharts' : 'Wallet'" />
            </el-icon>
          </div>
          <div class="bill-info">
            <div class="bill-name">
              {{ bill.name }}
              <el-tag v-if="!bill.active" size="small" type="info" effect="plain" style="margin-left:6px;">已暂停</el-tag>
            </div>
            <div class="bill-meta">
              <el-tag v-if="bill.Category" size="small" type="info" effect="plain" style="margin-right:4px;">{{ bill.Category.name }}</el-tag>
              <span class="freq-tag">{{ freqLabel(bill.frequency) }}</span>
              <span>{{ scheduleLabel(bill) }}</span>
              <span v-if="bill.nextRunDate">· 下次 {{ bill.nextRunDate }}</span>
            </div>
          </div>
        </div>

        <div class="bill-center">
          <div class="bill-amount" :class="bill.type">
            {{ bill.type === 'income' ? '+' : '-' }}¥{{ parseFloat(bill.amount).toFixed(2) }}
          </div>
          <div class="bill-runs" v-if="bill.totalRuns > 0">
            已执行 {{ bill.totalRuns }} 次
          </div>
        </div>

        <div class="bill-actions">
          <el-tooltip content="手动触发" placement="top">
            <button class="act-btn" @click="handleTrigger(bill)" :disabled="!bill.active">
              <el-icon><CaretRight /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="bill.active ? '暂停' : '启用'" placement="top">
            <button class="act-btn" :class="{ active: bill.active }" @click="handleToggle(bill)">
              <el-icon><component :is="bill.active ? 'VideoPause' : 'VideoPlay'" /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="编辑" placement="top">
            <button class="act-btn" @click="openEdit(bill)">
              <el-icon><Edit /></el-icon>
            </button>
          </el-tooltip>
          <el-popconfirm title="确定删除此定时任务？" @confirm="handleDelete(bill.id)">
            <template #reference>
              <button class="act-btn danger">
                <el-icon><Delete /></el-icon>
              </button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑定时任务' : '新建定时任务'"
      width="480px"
      class="form-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="如：物业费、工资入账" />
        </el-form-item>
        <el-form-item label="账本">
          <el-select v-model="form.bookId" placeholder="选择账本" style="width:100%;">
            <el-option v-for="b in accountingStore.books" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="form.amount" type="number" placeholder="0.00">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width:100%;" filterable clearable>
            <el-option v-for="c in filteredCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行频率">
          <el-select v-model="form.frequency" style="width:100%;" @change="onFreqChange">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每季度" value="quarterly" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>

        <!-- 每周：选星期几 -->
        <el-form-item v-if="form.frequency === 'weekly'" label="执行日">
          <el-select v-model="form.dayOfWeek" style="width:100%;">
            <el-option v-for="d in weekDays" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>

        <!-- 每月/每季/每年：选几号 -->
        <el-form-item v-if="['monthly','quarterly','yearly'].includes(form.frequency)" label="执行日">
          <el-input-number v-model="form.dayOfMonth" :min="1" :max="28" />
          <span style="margin-left:8px;color:#A08D7A;font-size:13px;">号</span>
        </el-form-item>

        <!-- 每年：选月份 -->
        <el-form-item v-if="form.frequency === 'yearly'" label="执行月份">
          <el-select v-model="form.monthOfYear" style="width:100%;">
            <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
          </el-select>
        </el-form-item>

        <el-form-item label="触发时间">
          <el-time-picker v-model="triggerTimeDate" format="HH:mm" value-format="HH:mm" placeholder="选择时间" style="width:100%;" />
        </el-form-item>

        <el-form-item label="有效期">
          <div style="display:flex;gap:8px;align-items:center;width:100%;">
            <el-date-picker v-model="form.startDate" type="date" placeholder="起始日" value-format="YYYY-MM-DD" style="flex:1;" clearable />
            <span style="color:#A08D7A;">至</span>
            <el-date-picker v-model="form.endDate" type="date" placeholder="长期有效" value-format="YYYY-MM-DD" style="flex:1;" clearable />
          </div>
          <div v-if="!form.endDate" style="font-size:12px;color:#8b5cf6;margin-top:4px;">💡 不设截止日期 = 长期有效</div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="可选" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const accountingStore = useAccountingStore()
const authStore = useAuthStore()
const bills = ref([])
const categories = ref([])
const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const triggerTimeDate = ref('')

const defaultForm = {
  name: '', bookId: '', type: 'expense', amount: '', categoryId: '',
  frequency: 'monthly', dayOfMonth: 1, dayOfWeek: 1, monthOfYear: 1,
  triggerTime: '00:00', startDate: new Date().toISOString().slice(0, 10), endDate: '', note: ''
}
const form = ref({ ...defaultForm })

const weekDays = [
  { value: 0, label: '周日' }, { value: 1, label: '周一' }, { value: 2, label: '周二' },
  { value: 3, label: '周三' }, { value: 4, label: '周四' }, { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

const activeCount = computed(() => bills.value.filter(b => b.active).length)
const totalRuns = computed(() => bills.value.reduce((sum, b) => sum + (b.totalRuns || 0), 0))
const filteredCategories = computed(() => categories.value.filter(c => c.type === form.value.type))

function freqLabel(f) {
  return { daily: '每天', weekly: '每周', monthly: '每月', quarterly: '每季度', yearly: '每年' }[f] || f
}

function scheduleLabel(bill) {
  const f = bill.frequency
  if (f === 'daily') return '每天执行'
  if (f === 'weekly') return `每${weekDays.find(d => d.value === bill.dayOfWeek)?.label || '周一'}执行`
  if (f === 'monthly') return `每月${bill.dayOfMonth}日执行`
  if (f === 'quarterly') return `每季度${bill.dayOfMonth}日执行`
  if (f === 'yearly') return `每年${bill.monthOfYear}月${bill.dayOfMonth}日执行`
  return ''
}

function onFreqChange(f) {
  if (f === 'daily') {
    form.value.dayOfWeek = 1
    form.value.dayOfMonth = 1
  }
}

onMounted(async () => {
  const catRes = await accountingApi.getCategories({ familyId: authStore.currentFamily?.id })
  categories.value = catRes.data
  if (accountingStore.currentBookId) {
    form.value.bookId = accountingStore.currentBookId
    loadBills()
  }
})

watch(() => accountingStore.currentBookId, (id) => {
  if (id) { form.value.bookId = id; loadBills() }
})

async function loadBills() {
  if (!accountingStore.currentBookId) { bills.value = []; return }
  loading.value = true
  try {
    const res = await accountingApi.getRecurringBills({ bookId: accountingStore.currentBookId })
    bills.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.value = { ...defaultForm, bookId: accountingStore.currentBookId || '' }
  triggerTimeDate.value = '00:00'
  showDialog.value = true
}

function openEdit(bill) {
  isEdit.value = true
  editId.value = bill.id
  form.value = {
    name: bill.name, bookId: bill.bookId, type: bill.type,
    amount: parseFloat(bill.amount), categoryId: bill.categoryId,
    frequency: bill.frequency, dayOfMonth: bill.dayOfMonth || 1,
    dayOfWeek: bill.dayOfWeek ?? 1, monthOfYear: bill.monthOfYear || 1,
    triggerTime: bill.triggerTime || '00:00',
    startDate: bill.startDate || '', endDate: bill.endDate || '',
    note: bill.note || ''
  }
  triggerTimeDate.value = bill.triggerTime || '00:00'
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.amount) return ElMessage.warning('请填写名称和金额')
  if (!form.value.bookId) return ElMessage.warning('请选择账本')
  saving.value = true
  try {
    const data = { ...form.value, triggerTime: triggerTimeDate.value || '00:00' }
    if (isEdit.value) {
      await accountingApi.updateRecurringBill(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await accountingApi.createRecurringBill(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadBills()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleToggle(bill) {
  try {
    await accountingApi.toggleRecurringBill(bill.id)
    ElMessage.success(bill.active ? '已暂停' : '已启用')
    loadBills()
  } catch (e) { console.error(e) }
}

async function handleTrigger(bill) {
  try {
    await accountingApi.triggerRecurringBill(bill.id)
    ElMessage.success('已触发记账')
    loadBills()
  } catch (e) { console.error(e) }
}

async function handleDelete(id) {
  try {
    await accountingApi.deleteRecurringBill(id)
    ElMessage.success('已删除')
    loadBills()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.recurring-page {
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

/* 统计 */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.mini-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 12px;
}
.ms-num {
  font-size: 20px;
  font-weight: 700;
  color: #6B5744;
}
.ms-num.active { color: #34d399; }
.ms-lbl {
  font-size: 13px;
  color: #A08D7A;
}

/* 空状态 */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #A08D7A;
  margin-top: 16px;
}
.empty-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 6px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* 任务列表 */
.bill-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bill-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 16px;
  transition: all 0.25s;
}
.bill-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.bill-card.paused {
  opacity: 0.6;
}

.bill-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.bill-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.bill-icon.expense {
  background: linear-gradient(135deg, #f87171, #D99A9A);
}
.bill-icon.income {
  background: linear-gradient(135deg, #34d399, #A8B08A);
}

.bill-name {
  font-size: 15px;
  font-weight: 600;
  color: #6B5744;
  display: flex;
  align-items: center;
}
.bill-meta {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.freq-tag {
  display: inline-block;
  padding: 1px 8px;
  background: rgba(102,126,234,0.08);
  color: #667eea;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.bill-center {
  text-align: right;
  flex-shrink: 0;
}
.bill-amount {
  font-size: 18px;
  font-weight: 700;
}
.bill-amount.expense { color: #f87171; }
.bill-amount.income { color: #34d399; }
.bill-runs {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 2px;
}

/* 操作按钮 */
.bill-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.act-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A08D7A;
  font-size: 16px;
  transition: all 0.2s;
}
.act-btn:hover:not(:disabled) {
  background: #F3EADD;
  color: #A08D7A;
}
.act-btn.active {
  color: #34d399;
}
.act-btn.active:hover {
  background: rgba(52,211,153,0.1);
  color: #A8B08A;
}
.act-btn.danger:hover {
  background: #fef2f2;
  color: #f87171;
}
.act-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 弹窗 */
.form-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
.form-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #F3EADD;
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
  .bill-card {
    flex-wrap: wrap;
  }
  .bill-center {
    text-align: left;
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

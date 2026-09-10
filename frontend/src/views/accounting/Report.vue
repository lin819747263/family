<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">报表分析</div>
      <div style="display:flex;gap:8px;">
        <el-button @click="$router.push('/accounting/annual-report')"><el-icon><DataBoard /></el-icon>年度报告</el-button>
        <el-button @click="exportReport('xlsx')"><el-icon><Download /></el-icon>导出Excel</el-button>
        <el-button @click="exportReport('pdf')"><el-icon><Document /></el-icon>导出PDF</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="report-tabs" @tab-change="onTabChange">
      <!-- 月报 Tab -->
      <el-tab-pane label="月报" name="month">
        <div style="margin-bottom:16px;">
          <el-date-picker v-model="reportMonth" type="month" placeholder="选择月份" value-format="YYYY-MM" style="width:140px;" @change="loadMonthly" />
        </div>

        <el-row :gutter="16" style="margin-bottom:20px;">
          <el-col :xs="12" :sm="6" v-for="(item, idx) in summaryCards" :key="idx" style="margin-bottom:12px;">
            <div class="card stat-card">
              <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-bottom:16px;">
          <el-col :xs="24" :sm="14" style="margin-bottom:16px;">
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-weight:600;">每日支出明细</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <el-button :icon="ArrowLeft" size="small" circle @click="changeDailyMonth(-1)" />
                  <span style="font-size:14px;min-width:80px;text-align:center;">{{ dailyMonthLabel }}</span>
                  <el-button :icon="ArrowRight" size="small" circle @click="changeDailyMonth(1)" />
                </div>
              </div>
              <div ref="dailyChart" style="width:100%;height:300px;"></div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="10" style="margin-bottom:16px;">
            <div class="card">
              <div style="font-weight:600;margin-bottom:12px;">支出分类占比</div>
              <div ref="pieChart" style="width:100%;height:300px;"></div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 年报 Tab -->
      <el-tab-pane label="年报" name="year">
        <div style="margin-bottom:16px;">
          <el-date-picker v-model="reportYear" type="year" placeholder="选择年份" value-format="YYYY" style="width:120px;" @change="loadYearly" />
        </div>

        <el-row :gutter="16" style="margin-bottom:20px;">
          <el-col :xs="24" :sm="8" style="margin-bottom:12px;">
            <div class="card annual-stat-card">
              <div class="asc-label">年度总支出</div>
              <div class="asc-value">¥{{ formatMoney(annualData.totalExpense) }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="16" style="margin-bottom:12px;">
            <div class="card">
              <div style="font-weight:600;margin-bottom:12px;">各月支出柱状图</div>
              <div ref="annualMonthlyChart" style="width:100%;height:240px;"></div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" style="margin-bottom:16px;">
            <div class="card">
              <div style="font-weight:600;margin-bottom:12px;">一级分类支出占比</div>
              <div ref="annualCategoryPie" style="width:100%;height:300px;"></div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" style="margin-bottom:16px;">
            <div class="card">
              <div style="font-weight:600;margin-bottom:12px;">一级分类支出排行</div>
              <div class="category-rank">
                <div v-for="(cat, idx) in annualData.byCategory" :key="cat.id" class="rank-item">
                  <div class="rank-left">
                    <span class="rank-num" :style="{ background: rankColors[idx % rankColors.length] }">{{ idx + 1 }}</span>
                    <span class="rank-name">{{ cat.icon }} {{ cat.name }}</span>
                  </div>
                  <div class="rank-right">
                    <span class="rank-amount">¥{{ formatMoney(cat.total) }}</span>
                    <span class="rank-pct">{{ annualData.totalExpense > 0 ? Math.round(cat.total / annualData.totalExpense * 100) : 0 }}%</span>
                  </div>
                </div>
                <div v-if="annualData.byCategory?.length === 0" class="empty-state">
                  <p>暂无数据</p>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 年度总览 Tab -->
      <el-tab-pane label="年度总览" name="matrix">
        <div style="margin-bottom:16px;">
          <el-date-picker v-model="matrixYear" type="year" placeholder="选择年份" value-format="YYYY" style="width:120px;" @change="loadMatrix" />
        </div>

        <div class="card" style="overflow-x:auto;">
          <div v-if="matrixLoading" class="loading-state">
            <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          </div>
          <div v-else-if="matrixData.length === 0" class="empty-state">
            <el-icon :size="48" color="var(--wood-light)"><Document /></el-icon>
            <p>暂无数据</p>
          </div>
          <table v-else class="matrix-table">
            <thead>
              <tr>
                <th class="col-cat">一级分类</th>
                <th class="col-sub">二级分类</th>
                <th v-for="m in 12" :key="m" class="col-month">{{ m }}月</th>
                <th class="col-total">合计</th>
                <th class="col-parent-total">年度总计</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(parent, pi) in matrixData" :key="parent.id">
                <!-- 一级分类合计行 -->
                <tr class="parent-row" :class="`group-${pi % 4}`">
                  <td :rowspan="parent.children.length + 1" class="cell-parent" v-if="parent.children.length > 0">
                    {{ parent.icon }} {{ parent.name }}
                  </td>
                  <td v-if="parent.children.length === 0">
                    {{ parent.icon }} {{ parent.name }}
                  </td>
                  <td v-if="parent.children.length === 0" class="cell-sub">-</td>
                  <template v-if="parent.children.length === 0">
                    <td v-for="m in 12" :key="m" class="cell-amount">
                      {{ formatMonthVal(0) }}
                    </td>
                    <td class="cell-total">{{ formatMonthVal(0) }}</td>
                    <td class="cell-parent-total-val">¥{{ formatMoney(0) }}</td>
                  </template>
                </tr>
                <!-- 二级分类行 -->
                <tr v-for="(child, ci) in parent.children" :key="child.id" class="child-row" :class="`group-${pi % 4}`">
                  <td class="cell-sub">{{ child.icon }} {{ child.name }}</td>
                  <td
                    v-for="m in 12"
                    :key="m"
                    class="cell-amount"
                    :class="{ 'cell-clickable': child[`m${m}`] > 0 }"
                    @click="child[`m${m}`] > 0 && goToDetail(child.id, child.name, m)"
                  >{{ formatMonthVal(child[`m${m}`]) }}</td>
                  <td class="cell-total">{{ formatMonthVal(child.total) }}</td>
                  <!-- 年度总计列：只在第一行显示，合并单元格 -->
                  <td v-if="ci === 0" :rowspan="parent.children.length" class="cell-parent-total-val">
                    ¥{{ formatMoney(parentTotal(parent)) }}
                  </td>
                </tr>
              </template>
              <!-- 总计行 -->
              <tr class="grand-total-row">
                <td colspan="2" class="cell-grand-label">总计</td>
                <td v-for="m in 12" :key="m" class="cell-grand">{{ formatMonthVal(grandMonthTotal(m)) }}</td>
                <td class="cell-grand-total">{{ formatMonthVal(matrixData.reduce((s, p) => s + p.children.reduce((ss, c) => ss + c.total, 0), 0)) }}</td>
                <td class="cell-grand-parent-total">¥{{ formatMoney(matrixData.reduce((s, p) => s + parentTotal(p), 0)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const accountingStore = useAccountingStore()
const activeTab = ref('month')

// 月报相关
const dailyChart = ref(null)
const pieChart = ref(null)
const reportMonth = ref(dayjs().format('YYYY-MM'))
const reportData = reactive({ income: 0, expense: 0, byCategory: [] })
const dailyData = ref([])
const dailyMonth = ref(dayjs().format('YYYY-MM'))

// 年报相关
const annualMonthlyChart = ref(null)
const annualCategoryPie = ref(null)
const reportYear = ref(dayjs().format('YYYY'))
const annualData = reactive({ totalExpense: 0, byCategory: [] })
const yearlyData = ref([])

// 年度总览相关
const matrixYear = ref(dayjs().format('YYYY'))
const matrixData = ref([])
const matrixLoading = ref(false)

let chartInstances = []
const rankColors = ['#B08466', '#96684A', '#7E8862', '#B06A6A', '#C08A3E', '#A98BB0', '#C89F85', '#6E8CA0']

const dailyMonthLabel = computed(() => {
  const [y, m] = dailyMonth.value.split('-')
  return `${y}年${parseInt(m)}月`
})

const summaryCards = computed(() => [
  { label: '月收入', value: `¥${formatMoney(reportData.income)}`, color: '#67C23A' },
  { label: '月支出', value: `¥${formatMoney(reportData.expense)}`, color: '#F56C6C' },
  { label: '月结余', value: `¥${formatMoney(reportData.income - reportData.expense)}`, color: '#409EFF' },
  { label: '支出占比', value: reportData.income > 0 ? `${Math.round((reportData.expense / reportData.income) * 100)}%` : '0%', color: '#E6A23C' }
])

onMounted(() => {
  if (accountingStore.currentBookId) loadMonthly()
})

watch(() => accountingStore.currentBookId, (id) => {
  if (id) {
    if (activeTab.value === 'month') loadMonthly()
    else if (activeTab.value === 'year') loadYearly()
    else if (activeTab.value === 'matrix') loadMatrix()
  }
})

function onTabChange(tab) {
  disposeCharts()
  if (tab === 'month') {
    nextTick(loadMonthly)
  } else if (tab === 'year') {
    nextTick(loadYearly)
  } else if (tab === 'matrix') {
    nextTick(loadMatrix)
  }
}

function disposeCharts() {
  chartInstances.forEach(c => c.dispose())
  chartInstances = []
}

// ===== 月报 =====
async function loadMonthly() {
  if (!accountingStore.currentBookId) return
  const [year, month] = reportMonth.value.split('-')
  const monthly = await accountingApi.getMonthlyReport({ bookId: accountingStore.currentBookId, year, month })
  reportData.income = monthly.data.income
  reportData.expense = monthly.data.expense
  reportData.byCategory = monthly.data.byCategory || []
  dailyMonth.value = reportMonth.value
  await loadDailyReport()
  nextTick(renderMonthlyCharts)
}

async function loadDailyReport() {
  if (!accountingStore.currentBookId) return
  const [year, month] = dailyMonth.value.split('-')
  const res = await accountingApi.getDailyReport({ bookId: accountingStore.currentBookId, year, month })
  dailyData.value = res.data || []
}

function changeDailyMonth(delta) {
  dailyMonth.value = dayjs(dailyMonth.value + '-01').add(delta, 'month').format('YYYY-MM')
  loadDailyReport().then(() => nextTick(renderDailyChart))
}

function renderDailyChart() {
  if (!dailyChart.value) return
  const existing = echarts.getInstanceByDom(dailyChart.value)
  if (existing) existing.dispose()
  const chart = echarts.init(dailyChart.value)
  const days = dailyData.value.map(d => `${d.day}日`)
  const expenses = dailyData.value.map(d => d.expense)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        return `${p.name}<br/>支出: <b>¥${parseFloat(p.value).toFixed(2)}</b>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { interval: 0, rotate: days.length > 15 ? 45 : 0, fontSize: 11 }
    },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{
      name: '支出',
      type: 'bar',
      data: expenses,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#F56C6C' },
          { offset: 1, color: '#fab6b6' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barMaxWidth: 32,
      emphasis: { itemStyle: { color: '#E63946' } }
    }]
  })
  chartInstances.push(chart)
}

function renderMonthlyCharts() {
  disposeCharts()
  renderDailyChart()
  // 饼图
  if (pieChart.value) {
    const chart = echarts.init(pieChart.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: reportData.byCategory.map(c => ({ name: c.name || '其他', value: parseFloat(c.total || 0) }))
      }]
    })
    chartInstances.push(chart)
  }
}

// ===== 年报 =====
async function loadYearly() {
  if (!accountingStore.currentBookId) return
  const year = reportYear.value
  const [yearly, yearlyCat] = await Promise.all([
    accountingApi.getYearlyReport({ bookId: accountingStore.currentBookId, year }),
    accountingApi.getYearlyCategoryReport({ bookId: accountingStore.currentBookId, year })
  ])
  yearlyData.value = yearly.data
  annualData.totalExpense = yearlyCat.data.totalExpense || 0
  annualData.byCategory = yearlyCat.data.byCategory || []
  nextTick(renderYearlyCharts)
}

// ===== 年度总览 =====
async function loadMatrix() {
  if (!accountingStore.currentBookId) return
  matrixLoading.value = true
  try {
    const res = await accountingApi.getYearlyCategoryMatrix({ bookId: accountingStore.currentBookId, year: matrixYear.value })
    matrixData.value = res.data || []
  } catch { matrixData.value = [] }
  finally { matrixLoading.value = false }
}

function goToDetail(catId, catName, month) {
  const ym = `${matrixYear.value}-${String(month).padStart(2, '0')}`
  router.push({ path: '/accounting', query: { month: ym, categoryId: catId, categoryName: catName } })
}

function formatMonthVal(v) {
  return v > 0 ? parseFloat(v).toFixed(2) : '-'
}

// 计算某父分类的月度合计
function parentMonthTotal(parent, m) {
  return parent.children.reduce((s, c) => s + (c[`m${m}`] || 0), 0)
}

// 计算一级分类全年总额
function parentTotal(parent) {
  return parent.children.reduce((s, c) => s + c.total, 0)
}

// 计算所有分类的月度总计
function grandMonthTotal(m) {
  return matrixData.value.reduce((s, p) => s + parentMonthTotal(p, m), 0)
}

function renderYearlyCharts() {
  disposeCharts()
  // 各月支出柱状图
  if (annualMonthlyChart.value) {
    const chart = echarts.init(annualMonthlyChart.value)
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: params => {
          const p = params[0]
          return `${p.name}<br/>支出: <b>¥${parseFloat(p.value).toFixed(2)}</b>`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: yearlyData.value.map(d => `${d.month}月`) },
      yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
      series: [{
        name: '支出',
        type: 'bar',
        data: yearlyData.value.map(d => d.expense),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#C89F85' },
            { offset: 1, color: '#E2CDB2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 36,
        emphasis: { itemStyle: { color: '#96684A' } }
      }]
    })
    chartInstances.push(chart)
  }
  // 分类饼图
  if (annualCategoryPie.value && annualData.byCategory.length) {
    const chart = echarts.init(annualCategoryPie.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: annualData.byCategory.map(c => ({ name: c.name, value: parseFloat(c.total || 0) }))
      }]
    })
    chartInstances.push(chart)
  }
}

async function exportReport(format) {
  if (!accountingStore.currentBookId) return
  const [year, month] = reportMonth.value.split('-')
  const startDate = `${year}-${month}-01`
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')
  try {
    const res = await accountingApi.exportReport({ bookId: accountingStore.currentBookId, startDate, endDate, format })
    const blob = new Blob([res], { type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `家庭账单报表_${reportMonth.value}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('导出失败') }
}
</script>

<style scoped>
.report-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}
.report-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
}

/* 统计卡片 */
.stat-card {
  text-align: center;
  padding: 20px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: #A08D7A;
}

/* 年度统计 */
.annual-stat-card {
  text-align: center;
  padding: 28px 20px;
}
.asc-label {
  font-size: 14px;
  color: #A08D7A;
  margin-bottom: 10px;
}
.asc-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--rose-d);
  line-height: 1.2;
}

/* 分类排行 */
.category-rank {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: #FBF6EF;
  border: 1px solid #F3EADD;
}
.rank-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rank-num {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rank-name {
  font-size: 14px;
  font-weight: 500;
  color: #6B5744;
}
.rank-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rank-amount {
  font-size: 15px;
  font-weight: 700;
  color: #6B5744;
}
.rank-pct {
  font-size: 13px;
  color: #A08D7A;
  min-width: 36px;
  text-align: right;
}

.empty-state {
  padding: 20px 0;
}
.empty-state p {
  margin: 0;
  font-size: 13px;
}

/* ========== 年度总览表格 ========== */
.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
  border-radius: 12px;
  overflow: hidden;
}
.matrix-table th,
.matrix-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #F3EADD;
  text-align: right;
  white-space: nowrap;
}
.matrix-table th {
  font-weight: 600;
  color: #A08D7A;
  background: linear-gradient(135deg, #FBF6EF, #F3EADD);
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 2px solid rgba(226,205,178,.7);
}
.matrix-table .col-cat,
.matrix-table .col-sub {
  text-align: left;
}
.matrix-table .col-cat { width: 110px; }
.matrix-table .col-sub { width: 120px; }
.matrix-table .col-month { min-width: 70px; }
.matrix-table .col-total { min-width: 80px; font-weight: 700; color: #6B5744; }
.matrix-table .col-parent-total { min-width: 90px; font-weight: 700; color: var(--terra-deep); }

/* 分组颜色 - 4 种交替色 */
.group-0 { --group-accent: var(--terracotta); --group-bg: rgba(200, 159, 133, 0.04); --group-bg-hover: rgba(200, 159, 133, 0.08); }
.group-1 { --group-accent: #A8B08A; --group-bg: rgba(16, 185, 129, 0.04); --group-bg-hover: rgba(16, 185, 129, 0.08); }
.group-2 { --group-accent: #E8B36A; --group-bg: rgba(245, 158, 11, 0.04); --group-bg-hover: rgba(245, 158, 11, 0.08); }
.group-3 { --group-accent: #ec4899; --group-bg: rgba(236, 72, 153, 0.04); --group-bg-hover: rgba(236, 72, 153, 0.08); }

.parent-row {
  background: var(--group-bg, #fafbff);
}
.parent-row:hover {
  background: var(--group-bg-hover, #f0f4ff);
}
.cell-parent {
  text-align: left !important;
  font-weight: 700;
  color: #6B5744;
  font-size: 14px;
  vertical-align: middle;
  background: var(--group-bg, #fafbff);
  border-right: 3px solid var(--group-accent, var(--terracotta));
  padding-left: 12px;
}
.child-row {
  transition: background 0.15s;
}
.child-row:hover {
  background: var(--group-bg-hover, #FBF6EF);
}
.cell-sub {
  text-align: left !important;
  color: #A08D7A;
  padding-left: 16px;
  border-right: 1px solid #F3EADD;
  position: relative;
}
/* 子分类前的圆点指示器 */
.cell-sub::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--group-accent, #A08D7A);
  margin-right: 8px;
  vertical-align: middle;
  opacity: 0.6;
}
.cell-amount {
  color: #A08D7A;
  font-variant-numeric: tabular-nums;
}
.cell-clickable {
  color: #6B5744;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}
.cell-clickable:hover {
  background: rgba(200, 159, 133, 0.1);
  color: var(--terra-deep);
  font-weight: 600;
}
.cell-total {
  font-weight: 700;
  color: #6B5744;
  font-variant-numeric: tabular-nums;
  border-left: 2px solid rgba(226,205,178,.7);
}

/* 年度总计列 */
.cell-parent-total-val {
  text-align: right !important;
  font-weight: 700;
  font-size: 14px;
  color: var(--group-accent, var(--terracotta));
  background: var(--group-bg, rgba(200, 159, 133, 0.03));
  border-left: 2px solid var(--group-accent, var(--terracotta));
  vertical-align: middle;
  padding-right: 12px;
}
.grand-total-row {
  background: linear-gradient(135deg, #f0f4ff, #faf5ff);
}
.grand-total-row td {
  font-weight: 700;
  border-top: 2px solid var(--terracotta);
}
.cell-grand-label {
  text-align: left !important;
  font-size: 14px;
  color: #6B5744;
  padding-left: 12px;
}
.cell-grand {
  color: #A08D7A;
  font-variant-numeric: tabular-nums;
}
.cell-grand-total {
  color: var(--rose-d);
  font-size: 15px;
  border-left: 2px solid rgba(226,205,178,.7);
}
.cell-grand-parent-total {
  color: var(--terra-deep);
  font-size: 15px;
  font-weight: 700;
  border-left: 2px solid rgba(200, 159, 133, 0.15);
  background: rgba(200, 159, 133, 0.03);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 18px;
  }
  .stat-value {
    font-size: 20px;
  }
  .stat-label {
    font-size: 12px;
  }
  .annual-stat-card {
    padding: 20px 14px;
  }
  .asc-value {
    font-size: 24px;
  }
  .rank-item {
    padding: 8px 10px;
  }
  .rank-name {
    font-size: 13px;
  }
  .rank-amount {
    font-size: 14px;
  }
  .matrix-table {
    font-size: 12px;
    min-width: 700px;
  }
  .matrix-table th,
  .matrix-table td {
    padding: 6px 4px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
  }
}
</style>

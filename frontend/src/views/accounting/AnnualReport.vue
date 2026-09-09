<template>
  <div class="annual-report">
    <div class="page-header">
      <div>
        <div class="page-title">📊 {{ year }} 年度报告</div>
        <p class="page-desc">回顾这一年的家庭财务、生活与成长</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/accounting/report')"><el-icon><TrendCharts /></el-icon>月度报表</el-button>
        <el-select v-model="year" style="width:120px;" @change="loadReport">
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:60px;">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p style="margin-top:12px;color:#A08D7A;">正在生成年度报告...</p>
    </div>

    <template v-else>
      <!-- 总览卡片 -->
      <div class="overview-cards">
        <div class="ov-card income-card">
          <div class="ov-icon">📈</div>
          <div class="ov-info">
            <div class="ov-label">全年收入</div>
            <div class="ov-value">¥{{ formatMoney(report.totalIncome) }}</div>
          </div>
        </div>
        <div class="ov-card expense-card">
          <div class="ov-icon">📉</div>
          <div class="ov-info">
            <div class="ov-label">全年支出</div>
            <div class="ov-value">¥{{ formatMoney(report.totalExpense) }}</div>
          </div>
        </div>
        <div class="ov-card balance-card">
          <div class="ov-icon">💰</div>
          <div class="ov-info">
            <div class="ov-label">全年结余</div>
            <div class="ov-value" :class="balance >= 0 ? 'positive' : 'negative'">
              ¥{{ formatMoney(balance) }}
            </div>
          </div>
        </div>
        <div class="ov-card count-card">
          <div class="ov-icon">📝</div>
          <div class="ov-info">
            <div class="ov-label">记账笔数</div>
            <div class="ov-value">{{ report.totalCount || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 月度趋势图 -->
      <div class="card chart-card">
        <div class="chart-title">月度收支趋势</div>
        <div ref="trendChart" class="chart-box"></div>
      </div>

      <!-- 支出分类排行 -->
      <div class="card">
        <div class="chart-title">支出分类 TOP 10</div>
        <div v-if="report.expenseCategories?.length" class="rank-list">
          <div v-for="(cat, i) in report.expenseCategories.slice(0, 10)" :key="cat.name" class="rank-item">
            <div class="rank-num" :class="{ top: i < 3 }">{{ i + 1 }}</div>
            <div class="rank-info">
              <div class="rank-name">{{ cat.name }}</div>
              <div class="rank-bar-wrap">
                <div class="rank-bar" :style="{ width: (cat.total / maxCategoryExpense * 100) + '%', background: categoryColors[i] }"></div>
              </div>
            </div>
            <div class="rank-amount">¥{{ formatMoney(cat.total) }}</div>
            <div class="rank-pct">{{ cat.percent }}%</div>
          </div>
        </div>
        <div v-else class="empty-state">暂无数据</div>
      </div>

      <!-- 收入分类排行 -->
      <div class="card" v-if="report.incomeCategories?.length">
        <div class="chart-title">收入分类</div>
        <div class="rank-list">
          <div v-for="(cat, i) in report.incomeCategories" :key="cat.name" class="rank-item">
            <div class="rank-num" :class="{ top: i < 3 }">{{ i + 1 }}</div>
            <div class="rank-info">
              <div class="rank-name">{{ cat.name }}</div>
              <div class="rank-bar-wrap">
                <div class="rank-bar" :style="{ width: (cat.total / maxCategoryIncome * 100) + '%', background: '#10b981' }"></div>
              </div>
            </div>
            <div class="rank-amount">¥{{ formatMoney(cat.total) }}</div>
          </div>
        </div>
      </div>

      <!-- 消费习惯 -->
      <div class="card">
        <div class="chart-title">消费习惯</div>
        <div class="habits-grid">
          <div class="habit-item">
            <span class="habit-emoji">📅</span>
            <span class="habit-label">日均支出</span>
            <span class="habit-value">¥{{ formatMoney(report.avgDailyExpense) }}</span>
          </div>
          <div class="habit-item">
            <span class="habit-emoji">📆</span>
            <span class="habit-label">月均支出</span>
            <span class="habit-value">¥{{ formatMoney(report.avgMonthlyExpense) }}</span>
          </div>
          <div class="habit-item">
            <span class="habit-emoji">🔥</span>
            <span class="habit-label">最大单笔支出</span>
            <span class="habit-value">¥{{ formatMoney(report.maxExpense?.amount) }}</span>
            <span class="habit-note">{{ report.maxExpense?.note || '' }}</span>
          </div>
          <div class="habit-item">
            <span class="habit-emoji">📊</span>
            <span class="habit-label">储蓄率</span>
            <span class="habit-value">{{ report.savingsRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 家庭成员消费对比 -->
      <div class="card" v-if="report.memberStats?.length > 1">
        <div class="chart-title">家庭成员消费对比</div>
        <div class="member-compare">
          <div v-for="m in report.memberStats" :key="m.name" class="member-row">
            <div class="member-name">{{ m.name }}</div>
            <div class="member-bar-wrap">
              <div class="member-bar expense-bar" :style="{ width: (m.expense / maxMemberExpense * 100) + '%' }">
                ¥{{ formatMoney(m.expense) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 年度总结语 -->
      <div class="card summary-card">
        <div class="summary-emoji">🎯</div>
        <div class="summary-title">{{ year }}年度总结</div>
        <div class="summary-text">
          全年共记账 <strong>{{ report.totalCount }}</strong> 笔，
          收入 <strong>¥{{ formatMoney(report.totalIncome) }}</strong>，
          支出 <strong>¥{{ formatMoney(report.totalExpense) }}</strong>，
          结余 <strong>¥{{ formatMoney(balance) }}</strong>。
          <template v-if="report.savingsRate >= 30">
            储蓄率达到 <strong>{{ report.savingsRate }}%</strong>，理财习惯很棒！继续保持 💪
          </template>
          <template v-else-if="report.savingsRate >= 10">
            储蓄率 <strong>{{ report.savingsRate }}%</strong>，还有提升空间，来年加油 📈
          </template>
          <template v-else>
            今年开销较大，新的一年可以试试制定预算计划 💡
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { accountingApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { useAccountingStore } from '@/store/accounting'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { formatMoney } from '@/utils/format'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const year = ref(dayjs().year())
const loading = ref(false)
const report = ref({})
const trendChart = ref(null)
let chartInstance = null
let resizeHandler = null

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
})

const yearOptions = computed(() => {
  const current = dayjs().year()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

const balance = computed(() => (report.value.totalIncome || 0) - (report.value.totalExpense || 0))
const maxCategoryExpense = computed(() => Math.max(...(report.value.expenseCategories || []).map(c => c.total), 1))
const maxCategoryIncome = computed(() => Math.max(...(report.value.incomeCategories || []).map(c => c.total), 1))
const maxMemberExpense = computed(() => Math.max(...(report.value.memberStats || []).map(m => m.expense), 1))

const categoryColors = [
  '#667eea', '#f472b6', '#f97316', '#fbbf24', '#34d399',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
]

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadReport()
})

watch(() => accountingStore.currentBookId, () => { loadReport() })

async function loadReport() {
  loading.value = true
  try {
    const params = { year: year.value }
    if (accountingStore.currentBookId) params.bookId = accountingStore.currentBookId

    // 并行请求年度月度数据和分类数据
    const [monthlyRes, categoryRes] = await Promise.all([
      accountingApi.getYearlyReport(params),
      accountingApi.getYearlyCategoryReport(params)
    ])

    const monthlyData = monthlyRes.data || []
    const categoryData = categoryRes.data || {}

    buildReport(monthlyData, categoryData)
    // loading 变 false 后 Vue 才会渲染图表容器，需要等两帧
    loading.value = false
    await nextTick()
    await nextTick()
    renderChart()
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

// 监听图表容器可用后渲染
watch(trendChart, (el) => {
  if (el && report.value.monthlyData?.length) renderChart()
})

function buildReport(monthlyData, categoryData) {
  let totalIncome = 0, totalExpense = 0
  for (const m of monthlyData) {
    totalIncome += m.income || 0
    totalExpense += m.expense || 0
  }

  // 支出分类
  const expenseCategories = (categoryData.byCategory || [])
    .sort((a, b) => b.total - a.total)
  const totalCatExpense = expenseCategories.reduce((s, c) => s + c.total, 0)
  expenseCategories.forEach(c => { c.percent = totalCatExpense > 0 ? Math.round(c.total / totalCatExpense * 100) : 0 })

  // 收入分类（如有）
  const incomeCategories = (categoryData.incomeByCategory || [])
    .sort((a, b) => b.total - a.total)
  const totalCatIncome = incomeCategories.reduce((s, c) => s + c.total, 0)
  incomeCategories.forEach(c => { c.percent = totalCatIncome > 0 ? Math.round(c.total / totalCatIncome * 100) : 0 })

  const daysInYear = dayjs(`${year.value}-12-31`).dayOfYear()
  const monthsPassed = monthlyData.filter(m => m.income > 0 || m.expense > 0).length || 1
  const avgDailyExpense = totalExpense / daysInYear
  const avgMonthlyExpense = totalExpense / monthsPassed
  const savingsRate = totalIncome > 0 ? Math.round((totalIncome - totalExpense) / totalIncome * 100) : 0

  report.value = {
    totalIncome, totalExpense, totalCount: 0,
    monthlyData, expenseCategories, incomeCategories,
    avgDailyExpense, avgMonthlyExpense, savingsRate,
    maxExpense: { amount: 0, note: '' },
    memberStats: []
  }
}

function renderChart() {
  if (!trendChart.value || !report.value.monthlyData?.length) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(trendChart.value)

  const months = report.value.monthlyData.map(m => m.month + '月')
  const incomes = report.value.monthlyData.map(m => m.income)
  const expenses = report.value.monthlyData.map(m => m.expense)

  chartInstance.setOption({
    tooltip: { trigger: 'axis', formatter: (params) => {
      let html = params[0].axisValue + '<br/>'
      params.forEach(p => {
        html += `${p.marker} ${p.seriesName}: ¥${formatMoney(p.value)}<br/>`
      })
      return html
    }},
    legend: { data: ['收入', '支出'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', axisLabel: { formatter: v => v >= 10000 ? (v / 10000) + 'w' : v } },
    series: [
      { name: '收入', type: 'bar', data: incomes, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
      { name: '支出', type: 'bar', data: expenses, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } }
    ]
  })

  // 清理旧的 resize 监听
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  resizeHandler = () => chartInstance?.resize()
  window.addEventListener('resize', resizeHandler)
}
</script>

<style scoped>
.annual-report { animation: fadeUp 0.5s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 800; color: #6B5744; }
.page-desc { font-size: 14px; color: #A08D7A; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; }
.card { background: #fff; border: 1px solid #F3EADD; border-radius: 16px; padding: 20px; margin-bottom: 16px; }

/* 总览卡片 */
.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.ov-card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px; border-radius: 16px; background: #fff;
  border: 1px solid #F3EADD; transition: all 0.25s;
}
.ov-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.ov-icon { font-size: 32px; }
.ov-label { font-size: 12px; color: #A08D7A; margin-bottom: 4px; }
.ov-value { font-size: 22px; font-weight: 800; color: #6B5744; }
.ov-value.positive { color: #A8B08A; }
.ov-value.negative { color: #D99A9A; }

/* 图表 */
.chart-card { padding: 20px; }
.chart-title { font-size: 17px; font-weight: 700; color: #6B5744; margin-bottom: 16px; }
.chart-box { width: 100%; height: 300px; }

/* 排行 */
.rank-list { display: flex; flex-direction: column; gap: 12px; }
.rank-item { display: flex; align-items: center; gap: 12px; }
.rank-num {
  width: 24px; height: 24px; border-radius: 6px; background: #F3EADD;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #A08D7A; flex-shrink: 0;
}
.rank-num.top { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 14px; color: #6B5744; margin-bottom: 4px; }
.rank-bar-wrap { height: 8px; background: #F3EADD; border-radius: 4px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 4px; }
.rank-amount { font-size: 14px; font-weight: 700; color: #6B5744; flex-shrink: 0; min-width: 80px; text-align: right; }
.rank-pct { font-size: 12px; color: #A08D7A; flex-shrink: 0; width: 36px; text-align: right; }

/* 消费习惯 */
.habits-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.habit-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px; border-radius: 14px; background: #FBF6EF;
}
.habit-emoji { font-size: 28px; }
.habit-label { font-size: 12px; color: #A08D7A; }
.habit-value { font-size: 20px; font-weight: 800; color: #6B5744; }
.habit-note { font-size: 11px; color: #A08D7A; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }

/* 成员对比 */
.member-compare { display: flex; flex-direction: column; gap: 14px; }
.member-row { display: flex; align-items: center; gap: 12px; }
.member-name { font-size: 14px; color: #6B5744; width: 60px; flex-shrink: 0; }
.member-bar-wrap { flex: 1; height: 28px; background: #F3EADD; border-radius: 8px; overflow: hidden; }
.member-bar {
  height: 100%; border-radius: 8px; display: flex; align-items: center;
  padding: 0 10px; font-size: 12px; font-weight: 600; color: #fff;
  transition: width 0.6s ease; white-space: nowrap;
}
.expense-bar { background: linear-gradient(135deg, #D99A9A, #f97316); }

/* 年度总结 */
.summary-card { text-align: center; padding: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: #fff; }
.summary-emoji { font-size: 48px; margin-bottom: 12px; }
.summary-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
.summary-text { font-size: 15px; line-height: 1.8; opacity: 0.9; }
.summary-text strong { color: #fbbf24; }

.empty-state { text-align: center; padding: 40px; color: #A08D7A; }

@media (max-width: 768px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
  .habits-grid { grid-template-columns: 1fr; }
  .chart-box { height: 240px; }
}
@media (max-width: 480px) {
  .overview-cards { grid-template-columns: 1fr; }
}
</style>

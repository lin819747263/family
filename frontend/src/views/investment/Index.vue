<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">💰 理财管理</div>
        <p class="page-desc">记录各平台盈亏，掌握家庭资产全貌</p>
      </div>
      <div class="header-actions">
        <el-select v-model="filterYear" style="width:100px;" @change="loadData">
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
        <el-button type="primary" @click="showForm = true"><el-icon><Plus /></el-icon>录入盈亏</el-button>
      </div>
    </div>

    <!-- 年度总览 -->
    <div class="overview-cards">
      <div class="ov-card" :class="stats.yearTotalProfit >= 0 ? 'profit' : 'loss'">
        <div class="ov-icon">{{ stats.yearTotalProfit >= 0 ? '📈' : '📉' }}</div>
        <div class="ov-info">
          <div class="ov-label">全年盈亏</div>
          <div class="ov-value">{{ stats.yearTotalProfit >= 0 ? '+' : '' }}¥{{ formatMoney(stats.yearTotalProfit) }}</div>
        </div>
      </div>
      <div class="ov-card">
        <div class="ov-icon">💼</div>
        <div class="ov-info">
          <div class="ov-label">账户余额</div>
          <div class="ov-value">¥{{ formatMoney(stats.yearTotalBalance) }}</div>
        </div>
      </div>
      <div class="ov-card">
        <div class="ov-icon">🏦</div>
        <div class="ov-info">
          <div class="ov-label">平台数量</div>
          <div class="ov-value">{{ stats.platformCount || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 月度趋势图 -->
    <div class="card chart-card">
      <div class="chart-title">月度盈亏趋势</div>
      <div ref="trendChart" class="chart-box"></div>
    </div>

    <!-- 平台排行 -->
    <div class="card" v-if="stats.platforms?.length">
      <div class="chart-title">平台盈亏排行</div>
      <div class="rank-list">
        <div v-for="(p, i) in stats.platforms" :key="p.platform" class="rank-item">
          <div class="rank-num" :class="{ top: i < 3 }">{{ i + 1 }}</div>
          <div class="rank-info">
            <div class="rank-name">{{ p.platform }}</div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" :class="p.totalProfit >= 0 ? 'profit-bar' : 'loss-bar'"
                :style="{ width: (Math.abs(p.totalProfit) / maxPlatformProfit * 100) + '%' }"></div>
            </div>
          </div>
          <div class="rank-amount" :class="p.totalProfit >= 0 ? 'text-profit' : 'text-loss'">
            {{ p.totalProfit >= 0 ? '+' : '' }}¥{{ formatMoney(p.totalProfit) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="card">
      <div class="chart-title" style="display:flex;justify-content:space-between;align-items:center;">
        <span>最近记录</span>
        <el-select v-model="filterPlatform" placeholder="全部平台" clearable size="small" style="width:140px;" @change="loadRecords">
          <el-option label="支付宝" value="支付宝" />
          <el-option label="京东" value="京东" />
          <el-option label="其他" value="其他" />
        </el-select>
      </div>
      <div v-if="records.length === 0" class="empty-state">暂无记录</div>
      <div v-else class="table-wrap">
        <el-table :data="records" stripe>
          <el-table-column prop="platform" label="平台" width="120" />
          <el-table-column label="年月" width="100">
            <template #default="{ row }">{{ row.year }}/{{ String(row.month).padStart(2, '0') }}</template>
          </el-table-column>
          <el-table-column label="盈亏" width="120">
            <template #default="{ row }">
              <span :class="parseFloat(row.profit) >= 0 ? 'text-profit' : 'text-loss'">
                {{ parseFloat(row.profit) >= 0 ? '+' : '' }}¥{{ formatMoney(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="余额" width="120">
            <template #default="{ row }">¥{{ formatMoney(row.balance) }}</template>
          </el-table-column>
          <el-table-column prop="note" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-popconfirm title="确定删除这条记录？" @confirm="handleDelete(row.id)">
                <template #reference><el-button text type="danger" size="small">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 录入弹窗 -->
    <el-dialog v-model="showForm" title="录入盈亏" width="440px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="平台">
          <el-select v-model="form.platform" placeholder="选择平台" style="width:100%">
            <el-option label="支付宝" value="支付宝" />
            <el-option label="京东" value="京东" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="年份">
              <el-input-number v-model="form.year" :min="2020" :max="2099" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月份">
              <el-select v-model="form.month" style="width:100%">
                <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="盈亏">
          <el-input v-model="form.profit" type="number" placeholder="正数盈利，负数亏损">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="账户余额">
          <el-input v-model="form.balance" type="number" placeholder="月末账户余额">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { investmentApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { formatMoney } from '@/utils/format'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const filterYear = ref(dayjs().year())
const filterPlatform = ref('')
const showForm = ref(false)
const saving = ref(false)
const loading = ref(false)
const records = ref([])
const platformList = ref([])
const trendChart = ref(null)
let chartInstance = null
let resizeHandler = null

const form = reactive({
  platform: '',
  year: dayjs().year(),
  month: dayjs().month() + 1,
  profit: '',
  balance: '',
  note: ''
})

const stats = ref({
  yearTotalProfit: 0,
  yearTotalBalance: 0,
  platformCount: 0,
  platforms: [],
  months: []
})

const yearOptions = computed(() => {
  const current = dayjs().year()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

const maxPlatformProfit = computed(() => {
  const max = Math.max(...(stats.value.platforms || []).map(p => Math.abs(p.totalProfit)), 1)
  return max
})

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadData()
})

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
})

watch(() => filterYear.value, () => loadData())

async function loadData() {
  await Promise.all([loadStats(), loadRecords(), loadPlatforms()])
}

async function loadStats() {
  try {
    const res = await investmentApi.getYearlyStats({ familyId: authStore.currentFamily.id, year: filterYear.value })
    stats.value = res.data
    await nextTick()
    await nextTick()
    renderChart()
  } catch (e) { console.error(e) }
}

async function loadRecords() {
  try {
    const params = { familyId: authStore.currentFamily.id, year: filterYear.value }
    if (filterPlatform.value) params.platform = filterPlatform.value
    const res = await investmentApi.getList(params)
    records.value = res.data || []
  } catch (e) { console.error(e) }
}

async function loadPlatforms() {
  try {
    const res = await investmentApi.getPlatforms({ familyId: authStore.currentFamily.id })
    platformList.value = res.data || []
  } catch (e) { console.error(e) }
}

function renderChart() {
  if (!trendChart.value || !stats.value.months?.length) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(trendChart.value)

  const months = stats.value.months.map(m => m.month + '月')
  const profits = stats.value.months.map(m => m.totalProfit)

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const color = p.value >= 0 ? '#10b981' : '#ef4444'
        return `${p.axisValue}<br/><span style="color:${color};font-weight:700;">${p.value >= 0 ? '+' : ''}¥${formatMoney(p.value)}</span>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: v => v >= 10000 ? (v / 10000) + 'w' : v }
    },
    series: [{
      type: 'bar',
      data: profits.map(v => ({
        value: v,
        itemStyle: { color: v >= 0 ? '#10b981' : '#ef4444', borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4] }
      })),
      barMaxWidth: 40
    }]
  })

  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  resizeHandler = () => chartInstance?.resize()
  window.addEventListener('resize', resizeHandler)
}

async function handleSave() {
  if (!form.platform) return ElMessage.warning('请选择平台')
  if (!form.profit && form.profit !== 0) return ElMessage.warning('请输入盈亏金额')
  saving.value = true
  try {
    await investmentApi.upsert({
      familyId: authStore.currentFamily.id,
      ...form,
      profit: parseFloat(form.profit) || 0,
      balance: parseFloat(form.balance) || 0
    })
    ElMessage.success('保存成功')
    showForm.value = false
    form.profit = ''
    form.balance = ''
    form.note = ''
    loadData()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await investmentApi.remove(id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 800; color: #1e293b; }
.page-desc { font-size: 14px; color: #94a3b8; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; }
.card { background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 16px; }

/* 总览卡片 */
.overview-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.ov-card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px; border-radius: 16px; background: #fff;
  border: 1px solid #f1f5f9; transition: all 0.25s;
}
.ov-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.ov-card.profit { border-color: rgba(16,185,129,0.3); background: linear-gradient(135deg, #f0fdf4, #ecfdf5); }
.ov-card.loss { border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, #fef2f2, #fff1f2); }
.ov-icon { font-size: 32px; }
.ov-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.ov-value { font-size: 22px; font-weight: 800; color: #1e293b; }

/* 图表 */
.chart-card { padding: 20px; }
.chart-title { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
.chart-box { width: 100%; height: 280px; }

/* 排行 */
.rank-list { display: flex; flex-direction: column; gap: 12px; }
.rank-item { display: flex; align-items: center; gap: 12px; }
.rank-num {
  width: 24px; height: 24px; border-radius: 6px; background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #64748b; flex-shrink: 0;
}
.rank-num.top { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 14px; color: #1e293b; margin-bottom: 4px; }
.rank-bar-wrap { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 4px; }
.profit-bar { background: linear-gradient(90deg, #10b981, #34d399); }
.loss-bar { background: linear-gradient(90deg, #ef4444, #f87171); }
.rank-amount { font-size: 14px; font-weight: 700; flex-shrink: 0; min-width: 100px; text-align: right; }

/* 文字颜色 */
.text-profit { color: #10b981; }
.text-loss { color: #ef4444; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; }

@media (max-width: 768px) {
  .overview-cards { grid-template-columns: 1fr; }
  .chart-box { height: 220px; }
}
</style>

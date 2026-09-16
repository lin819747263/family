<template>
  <div>
    <div class="rpt-head">
      <div>
        <div class="page-title" style="margin-bottom:0;">📊 报表分析</div>
        <div class="page-sub">{{ pageSub }}</div>
      </div>
    </div>

    <div class="period-bar">
      <div class="seg">
        <button v-for="m in modes" :key="m.key" :class="{ on: mode === m.key }" @click="setMode(m.key)">{{ m.icon }} {{ m.label }}</button>
      </div>
      <div v-if="mode === 'custom'" class="range-box">
        <input type="date" class="date-in" :value="customStart" @change="customStart = $event.target.value" />
        <span class="range-sep">至</span>
        <input type="date" class="date-in" :value="customEnd" @change="customEnd = $event.target.value" />
      </div>
      <div v-if="mode !== 'custom'" class="time-nav">
        <button class="tn-btn" :disabled="atNow" @click="shift(-1)">‹</button>
        <div class="tn-label">
          {{ periodLabel }}
          <span class="tn-sub">{{ periodSub }}</span>
        </div>
        <button class="tn-btn" :disabled="atNow" @click="shift(1)">›</button>
        <button class="btn ghost sm" @click="goNow">回到{{ nowWord }}</button>
      </div>
      <div v-if="mode === 'custom'" class="quick-row">
        <button v-for="q in quickOpts" :key="q.key" :class="['q-chip', { on: isQuickActive(q.key) }]" @click="setQuick(q.key)">{{ q.label }}</button>
      </div>
    </div>

    <section v-if="mode !== 'matrix'">
      <div class="kpi-grid">
        <div v-for="(k, i) in kpiCards" :key="i" class="kpi" :style="{ '--kc': k.color }">
          <div class="kpi-top">
            <div class="kpi-ico">{{ k.icon }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
          <div class="kpi-val">{{ k.display }}</div>
          <div class="kpi-foot">
            <span :class="['delta', k.deltaClass]">{{ k.deltaText }}</span>
            <svg v-if="k.sparkPts.length > 1" class="spark" viewBox="0 0 70 24" preserveAspectRatio="none">
              <polygon :points="sparkArea(k.sparkPts)" />
              <polyline :points="sparkLine(k.sparkPts)" />
            </svg>
          </div>
          <div class="kpi-note">{{ k.note }}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">📈 收支趋势</div>
              <div class="card-sub">{{ trendSub }}</div>
            </div>
            <div class="trend-controls">
              <button v-if="trendGran === 'day'" :class="['toggle', { on: exFixed }]" @click="exFixed = !exFixed"><i></i>剔除固定支出</button>
              <div class="chips">
                <button :class="{ on: series === 'expense' }" @click="series = 'expense'">支出</button>
                <button :class="{ on: series === 'income' }" @click="series = 'income'">收入</button>
                <button :class="{ on: series === 'compare' }" @click="series = 'compare'">收支对比</button>
              </div>
            </div>
          </div>
          <div class="chart">
            <div class="glines">
              <div v-for="(g, i) in gridLines" :key="i" class="gl">
                <span>{{ g.label }}</span>
              </div>
            </div>
            <div class="cols">
              <div v-for="(b, i) in trendBars" :key="i" :class="['col', { weekend: b.weekend, future: b.future, zero: b.zero }]">
                <div class="col-tip">
                  <div class="tip-date">{{ b.label }}</div>
                  <div v-if="b.showExp" class="tip-row" style="color:var(--rose-d)">支出 ¥{{ Math.round(b.expense) }}</div>
                  <div v-if="b.showInc" class="tip-row" style="color:var(--sage-d)">收入 ¥{{ Math.round(b.income) }}</div>
                </div>
                <div class="pair">
                  <i v-if="b.showInc" class="bar inc" :style="{ height: animReady ? b.incH + '%' : '0%' }"></i>
                  <i v-if="b.showExp" :class="['bar', 'exp', { peak: b.isPeak }]" :style="{ height: animReady ? b.expH + '%' : '0%' }"></i>
                </div>
                <span class="col-lbl">{{ b.showLabel ? b.label : '' }}</span>
              </div>
            </div>
            <div v-if="avgPct > 0 && series !== 'compare'" class="avg-line" :style="{ bottom: `calc(24px + (100% - 24px) * ${avgPct / 100})` }">
              <span class="avg-tag">{{ trendGran === 'day' ? '日均' : '月均' }} ¥{{ Math.round(avgVal) }}</span>
            </div>
          </div>
          <div class="chart-foot">
            <span class="lg-inline"><i :style="{ background: series === 'income' ? 'var(--sage-d)' : 'var(--rose-d)' }"></i>{{ seriesLabel }}</span>
            <span>峰值 <b>{{ peakLabel }}</b></span>
            <span>合计 <b>¥{{ seriesTotal }}</b></span>
            <span>{{ trendGran === 'day' ? '日均' : '月均' }} <b>¥{{ Math.round(avgVal) }}</b></span>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">🍩 分类占比</div>
              <div class="card-sub">{{ donutSub }}</div>
            </div>
            <div class="chips">
              <button :class="{ on: catType === 'expense' }" @click="catType = 'expense'">支出</button>
              <button :class="{ on: catType === 'income' }" @click="catType = 'income'">收入</button>
            </div>
          </div>
          <div class="donut-wrap">
            <div class="donut">
              <svg width="164" height="164" viewBox="0 0 164 164">
                <circle cx="82" cy="82" r="62" :stroke="getCssVar('--bg-card-alt')" stroke-dasharray="389.56 0" fill="none" stroke-width="22" />
                <circle v-for="s in donutSegments" :key="s.idx" class="seg-c" cx="82" cy="82" r="62" :stroke="s.color" fill="none" stroke-width="22"
                  :stroke-dasharray="animReady ? `${s.len} ${389.56 - s.len}` : `0 389.56`"
                  :stroke-dashoffset="s.off" :style="{ transition: animReady ? 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1)' : 'none' }" />
              </svg>
              <div class="donut-center">
                <span class="dc-num">¥{{ fmtMoney(donutTotal) }}</span>
                <span class="dc-lbl">{{ catType === 'expense' ? '本期支出' : '本期收入' }}</span>
              </div>
            </div>
            <div class="legend">
              <div v-for="s in donutSegments" :key="s.idx" class="lg">
                <span class="lg-dot" :style="{ background: s.color }"></span>
                <span class="lg-name">{{ s.name }}</span>
                <span class="lg-val">¥{{ Math.round(s.total) }}</span>
                <span class="lg-pct">{{ s.pct }}%</span>
              </div>
              <div v-if="!donutSegments.length" class="empty-hint">该周期暂无数据</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div class="card-head">
          <div>
            <div class="card-title"> 分类排行</div>
            <div class="card-sub">点击任意分类可展开二级明细</div>
          </div>
          <div class="card-sub">{{ periodLabel }} · TOP {{ rankList.length }}</div>
        </div>
        <div class="rank">
          <div v-for="(r, i) in rankList" :key="r.idx" :class="['rank-item', { open: openRanks.has(r.idx) }]">
            <div class="rank-row" @click="toggleRank(r.idx)">
              <span class="rank-num" :style="{ background: r.color }">{{ i + 1 }}</span>
              <span class="rank-name">{{ r.icon }} {{ r.name }}</span>
              <div class="rank-bar"><i :style="{ width: animReady ? r.barW + '%' : '0%', background: r.color }"></i></div>
              <span class="rank-val">¥{{ Math.round(r.total) }}</span>
              <span class="rank-pct">{{ r.pct }}%</span>
              <span v-if="r.children.length" class="rank-caret" :style="{ transform: openRanks.has(r.idx) ? 'rotate(90deg)' : '' }">▶</span>
            </div>
            <div v-if="r.children.length" class="sub-rank">
              <div v-for="k in r.children" :key="k.name" class="sub-item">
                <span class="sub-name">{{ k.name }}</span>
                <div class="sub-bar"><i :style="{ width: animReady ? k.barW + '%' : '0%', background: r.color + '88' }"></i></div>
                <span class="sub-val">¥{{ Math.round(k.total) }}</span>
              </div>
            </div>
          </div>
          <div v-if="!rankList.length" class="empty-hint">该周期暂无数据</div>
        </div>
      </div>
    </section>

    <section v-if="mode === 'matrix'">
      <div class="mx-stats">
        <div v-for="(s, i) in mxSummaryCards" :key="i" class="mx-stat">
          <div class="mx-l">{{ s.label }}</div>
          <div class="mx-v">{{ s.value }}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">🧮 年度分类矩阵</div>
            <div class="card-sub">一级 / 二级分类 × 12 个月，点击金额可下钻到当月账单</div>
          </div>
        </div>
        <div class="mx-tools">
          <button :class="['toggle', { on: mxHeat }]" @click="mxHeat = !mxHeat"><i></i>热力色阶</button>
          <button :class="['toggle', { on: mxHideEmpty }]" @click="mxHideEmpty = !mxHideEmpty"><i></i>隐藏空行</button>
          <button :class="['toggle', { on: mxExpandAll }]" @click="toggleMxExpand">
            <i></i>{{ mxExpandAll ? '收起全部' : '展开全部' }}
          </button>
          <span class="mx-hint">{{ matrixData.length }} 个一级分类 · {{ mxRowCount }} 行明细</span>
        </div>
        <div class="mx-scroll">
          <table v-if="matrixData.length" class="mx">
            <thead>
              <tr>
                <th class="s1">一级分类</th>
                <th class="s2">二级分类</th>
                <th v-for="m in 12" :key="m">{{ m }}月</th>
                <th>合计</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="p in matrixData" :key="p.id">
                <tr :class="['prow', { collapsed: mxCollapsed.has(p.id) }]" :style="mxVars(p)">
                  <td class="s1 cell-parent" @click="toggleMxCollapse(p.id)">
                    <span class="caret">▼</span> {{ p.icon }} {{ p.name }}
                  </td>
                  <td class="s2 cell-psum" @click="toggleMxCollapse(p.id)">{{ p.children.length }} 个二级分类 · 小计</td>
                  <td v-for="m in 12" :key="m" class="pamt" :style="mxHeatStyle(mxParentMonth(p, m), p)">{{ fmtCell(mxParentMonth(p, m)) }}</td>
                  <td class="ptotal">{{ fmtCell(mxParentTotal(p)) }}</td>
                </tr>
                <template v-if="!mxCollapsed.has(p.id)">
                  <tr v-for="c in p.children" :key="c.id" class="crow" :style="mxVars(p)">
                    <td class="s1"></td>
                    <td class="s2 cell-sub">{{ c.icon }} {{ c.name }}</td>
                    <td v-for="m in 12" :key="m"
                      :class="['amt', c['m' + m] > 0 ? 'has' : 'none']"
                      :style="mxHeatStyle(c['m' + m], p)"
                      @click="c['m' + m] > 0 && goToMonth(m, p.name, c.name)">
                      {{ c['m' + m] > 0 ? fmtCell(c['m' + m]) : '-' }}
                    </td>
                    <td class="rowtotal">{{ fmtCell(c.total) }}</td>
                  </tr>
                </template>
              </template>
              <tr class="gtotal">
                <td class="s1">总计</td>
                <td class="s2">{{ matrixYear }}年</td>
                <td v-for="m in 12" :key="m" :class="{ hi: m === mxPeakMonth }">{{ fmtCell(mxGrandMonth(m)) }}</td>
                <td class="hi">{{ fmtCell(mxGrandTotal) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="mx-empty">该年度暂无支出数据</div>
        </div>
        <div class="mx-note">
          <span class="heat-scale">低 <i v-for="n in 4" :key="n" :style="{ background: heatScaleColor(n - 1) }"></i> 高</span>
          <span>· 颜色深浅表示该分类当月支出强度，同一一级分类内可比</span>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { formatMoney } from '@/utils/format'
import { getCssVar } from '@/utils/color'

const router = useRouter()
const route = useRoute()
const store = useAccountingStore()

const PAL = ['--terracotta', '--amber', '--sage', '--sky', '--rose', '--plum', '--terra-deep', '--amber-d', '--sage-d', '--sky-d']
  .map(v => getCssVar(v))

const pad = n => String(n).padStart(2, '0')
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)
const dayDiff = (a, b) => Math.round((b - a) / 864e5)
const startOfWeek = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, -((x.getDay() + 6) % 7)) }
const md = d => `${d.getMonth() + 1}/${d.getDate()}`
const TODAY = new Date()

function isoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7))
  const first = new Date(t.getFullYear(), 0, 4)
  return 1 + Math.round(((t - first) / 864e5 - 3 + ((first.getDay() + 6) % 7)) / 7)
}

const modes = [
  { key: 'week', icon: '📅', label: '周' },
  { key: 'month', icon: '🗓️', label: '月' },
  { key: 'year', icon: '📊', label: '年' },
  { key: 'custom', icon: '🎚️', label: '自定义' },
  { key: 'matrix', icon: '🧮', label: '年度总览' },
]
const quickOpts = [
  { key: '7', label: '近 7 天' },
  { key: '30', label: '近 30 天' },
  { key: '90', label: '近 90 天' },
  { key: 'ytd', label: '今年至今' },
  { key: 'lastyear', label: '去年全年' },
]

const mode = ref('month')
const anchor = ref(new Date(TODAY))
const matrixYear = ref(TODAY.getFullYear())
const series = ref('expense')
const catType = ref('expense')
const exFixed = ref(true)
const customStart = ref(dkey(addDays(TODAY, -29)))
const customEnd = ref(dkey(TODAY))
const mxHeat = ref(true)
const mxHideEmpty = ref(true)
const mxExpandAll = ref(false)
const mxCollapsed = ref(new Set())
const openRanks = ref(new Set())
const animReady = ref(false)

const rangeData = ref(null)
const matrixData = ref([])

const fmtMoney = v => formatMoney(v)

function compact(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '万'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return String(Math.round(n))
}

function fmtCell(v) {
  if (!v || v <= 0) return '-'
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : Math.round(v).toLocaleString('zh-CN')
}

const periodRange = computed(() => {
  const a = anchor.value
  if (mode.value === 'week') {
    const s = startOfWeek(a), e = addDays(s, 6)
    const inp = e > TODAY
    const elapsed = inp ? Math.max(1, dayDiff(s, TODAY) + 1) : 7
    const ps = addDays(s, -7)
    const pe = inp ? addDays(ps, elapsed - 1) : addDays(s, -1)
    return { s, e, ps, pe, gran: 'day', lbl: 'weekday', inp,
      label: `${s.getFullYear()}年 第${isoWeek(s)}周`, sub: `${md(s)} – ${md(e)}`,
      word: '本周', cmp: inp ? '上周同期' : '环比', now: '本周' }
  }
  if (mode.value === 'month') {
    const s = new Date(a.getFullYear(), a.getMonth(), 1)
    const e = new Date(a.getFullYear(), a.getMonth() + 1, 0)
    const inp = e > TODAY
    const ps = addMonths(s, -1)
    const pe = inp
      ? new Date(ps.getFullYear(), ps.getMonth(), Math.min(TODAY.getDate(), new Date(ps.getFullYear(), ps.getMonth() + 1, 0).getDate()))
      : new Date(ps.getFullYear(), ps.getMonth() + 1, 0)
    return { s, e, ps, pe, gran: 'day', lbl: 'day', inp,
      label: `${s.getFullYear()}年${s.getMonth() + 1}月`, sub: `${md(s)} – ${md(e)}`,
      word: '本月', cmp: inp ? '上月同期' : '环比', now: '本月' }
  }
  if (mode.value === 'year') {
    const y = a.getFullYear()
    const s = new Date(y, 0, 1)
    const capped = new Date(y, 11, 31) > TODAY
    const e = capped ? new Date(TODAY) : new Date(y, 11, 31)
    const pe = capped ? new Date(y - 1, TODAY.getMonth(), TODAY.getDate()) : new Date(y - 1, 11, 31)
    return { s, e, ps: new Date(y - 1, 0, 1), pe, gran: 'month', lbl: 'month', year: y, capped, inp: capped,
      label: `${y}年`, sub: capped ? `1/1 – ${md(e)} · 今年至今` : '1/1 – 12/31',
      word: '全年', cmp: capped ? '去年同期' : '同比', now: '今年' }
  }
  if (mode.value === 'custom') {
    const s = new Date(customStart.value + 'T00:00:00')
    const e = new Date(customEnd.value + 'T00:00:00')
    const span = Math.max(1, dayDiff(s, e) + 1)
    const pe = addDays(s, -1), ps = addDays(pe, -(span - 1))
    return { s, e, ps, pe, gran: span > 62 ? 'month' : 'day', lbl: span > 62 ? 'month' : 'day', span,
      label: '自定义区间', sub: `${md(s)} – ${md(e)} · ${span} 天`,
      inp: customEnd.value === dkey(TODAY), word: '区间', cmp: '环比', now: '近30天' }
  }
  const y = matrixYear.value
  const capped = y === TODAY.getFullYear()
  return { s: new Date(y, 0, 1), e: capped ? new Date(TODAY) : new Date(y, 11, 31),
    gran: 'month', lbl: 'month', year: y, capped, inp: capped,
    label: `${y}年`, sub: '年度分类矩阵', word: '全年', cmp: capped ? '去年同期' : '同比', now: '今年' }
})

const prevDates = computed(() => {
  const r = periodRange.value
  const days = dayDiff(r.s, r.e) + 1
  const pe = addDays(r.s, -1)
  const ps = addDays(pe, -(days - 1))
  return { ps: dkey(ps), pe: dkey(pe) }
})

const periodLabel = computed(() => periodRange.value.label)
const periodSub = computed(() => periodRange.value.sub)
const nowWord = computed(() => mode.value === 'matrix' ? '今年' : periodRange.value.now)

const atNow = computed(() => {
  const r = periodRange.value
  if (mode.value === 'week' || mode.value === 'month') {
    const todayRange = { ...periodRange.value, anchor: new Date(TODAY) }
    const a2 = new Date(TODAY)
    let todayStart
    if (mode.value === 'week') todayStart = startOfWeek(a2)
    else todayStart = new Date(a2.getFullYear(), a2.getMonth(), 1)
    return dkey(r.s) === dkey(todayStart)
  }
  if (mode.value === 'year') return r.year === TODAY.getFullYear()
  if (mode.value === 'matrix') return r.year === TODAY.getFullYear()
  return true
})

async function loadData() {
  if (!store.currentBookId || mode.value === 'matrix') return
  const r = periodRange.value
  const [cur, prev] = await Promise.all([
    accountingApi.getRangeReport({ bookId: store.currentBookId, startDate: dkey(r.s), endDate: dkey(r.e), groupBy: r.gran }),
    accountingApi.getRangeReport({ bookId: store.currentBookId, startDate: prevDates.value.ps, endDate: prevDates.value.pe, groupBy: r.gran }),
  ])
  rangeData.value = { cur: cur.data, prev: prev.data }
}

async function loadMatrix() {
  if (!store.currentBookId) return
  try {
    const res = await accountingApi.getYearlyCategoryMatrix({ bookId: store.currentBookId, year: matrixYear.value })
    matrixData.value = res.data || []
  } catch { matrixData.value = [] }
}

function setMode(m) {
  mode.value = m
  if (m === 'matrix') matrixYear.value = anchor.value.getFullYear()
  applyModeDefaults()
}

function applyModeDefaults() {
  const r = periodRange.value
  series.value = mode.value === 'year' ? 'compare' : 'expense'
  exFixed.value = r.gran === 'day'
}

function shift(dir) {
  if (mode.value === 'week') anchor.value = addDays(anchor.value, dir * 7)
  else if (mode.value === 'month') anchor.value = addMonths(anchor.value, dir)
  else if (mode.value === 'year') anchor.value = new Date(anchor.value.getFullYear() + dir, anchor.value.getMonth(), 1)
  else if (mode.value === 'matrix') { matrixYear.value += dir; anchor.value = new Date(matrixYear.value, 0, 1) }
}

function goNow() {
  anchor.value = new Date(TODAY)
  if (mode.value === 'matrix') matrixYear.value = TODAY.getFullYear()
  if (mode.value === 'custom') { customStart.value = dkey(addDays(TODAY, -29)); customEnd.value = dkey(TODAY) }
}

function isQuickActive(q) {
  const span = dayDiff(new Date(customStart.value + 'T00:00:00'), new Date(customEnd.value + 'T00:00:00')) + 1
  const isEnd = customEnd.value === dkey(TODAY)
  if (q === 'ytd') return isEnd && customStart.value === `${TODAY.getFullYear()}-01-01`
  if (q === 'lastyear') return customStart.value === `${TODAY.getFullYear() - 1}-01-01`
  return isEnd && span === +q
}

function setQuick(q) {
  if (q === 'ytd') { customStart.value = `${TODAY.getFullYear()}-01-01`; customEnd.value = dkey(TODAY) }
  else if (q === 'lastyear') { const y = TODAY.getFullYear() - 1; customStart.value = `${y}-01-01`; customEnd.value = `${y}-12-31` }
  else { customStart.value = dkey(addDays(TODAY, -(+q - 1))); customEnd.value = dkey(TODAY) }
}

const pageSub = computed(() => {
  const book = store.books?.find(b => b.id === store.currentBookId)
  return `${book?.name || '家庭账本'} · 数据截至 ${dkey(TODAY)}`
})

const periodWord = computed(() => {
  const r = periodRange.value
  return r.inp && mode.value !== 'custom'
    ? (mode.value === 'year' ? '今年至今' : r.word + '至今')
    : r.word
})

const kpiCards = computed(() => {
  if (!rangeData.value) return []
  const { cur, prev } = rangeData.value
  const r = periodRange.value
  const w = periodWord.value
  const span = r.span || dayDiff(r.s, r.e) + 1
  const dailyAvg = cur.expense / Math.max(1, span)
  const prevDailyAvg = prev.expense / Math.max(1, dayDiff(r.ps, r.pe) + 1)

  const cards = [
    { label: `${w}支出`, icon: '💸', val: cur.expense, color: getCssVar('--rose-d'),
      delta: deltaText(cur.expense, prev.expense, true, r.cmp), deltaClass: deltaClass(cur.expense, prev.expense, true),
      sparkPts: (cur.timeSeries || []).map(b => exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense),
      note: `${cur.expenseCount || 0} 笔 · 日均 ¥${Math.round(dailyAvg)}` },
    { label: `${w}收入`, icon: '💰', val: cur.income, color: getCssVar('--sage-d'),
      delta: deltaText(cur.income, prev.income, false, r.cmp), deltaClass: deltaClass(cur.income, prev.income, false),
      sparkPts: (cur.timeSeries || []).map(b => b.income),
      note: `${cur.incomeCount || (cur.count || 0) - (cur.expenseCount || 0)} 笔入账` },
    { label: `${w}结余`, icon: '⚖️', val: cur.income - cur.expense, color: cur.income - cur.expense >= 0 ? getCssVar('--terra-deep') : getCssVar('--rose-d'),
      delta: deltaText(cur.income - cur.expense, prev.income - prev.expense, false, r.cmp, true), deltaClass: deltaClass(cur.income - cur.expense, prev.income - prev.expense, false),
      sparkPts: (cur.timeSeries || []).map(b => b.income - b.expense),
      note: cur.income - cur.expense >= 0 ? '收大于支，稳' : '支出超过收入' },
  ]

  if (mode.value === 'month' || mode.value === 'year') {
    const rate = cur.income > 0 ? Math.round((cur.income - cur.expense) / cur.income * 1000) / 10 : 0
    const prevRate = prev.income > 0 ? Math.round((prev.income - prev.expense) / prev.income * 1000) / 10 : 0
    cards.push({ label: '储蓄率', icon: '🏦', val: rate, isPct: true, color: getCssVar('--sky-d'),
      delta: deltaText(rate, prevRate, false, r.cmp), deltaClass: deltaClass(rate, prevRate, false),
      sparkPts: (cur.timeSeries || []).map(b => b.income > 0 ? (b.income - b.expense) / b.income * 100 : null),
      note: `收入 ¥${compact(cur.income)} · 结余 ¥${compact(cur.income - cur.expense)}` })
  } else {
    cards.push({ label: '日均支出', icon: '📆', val: dailyAvg, color: getCssVar('--amber-d'),
      delta: deltaText(dailyAvg, prevDailyAvg, true, r.cmp), deltaClass: deltaClass(dailyAvg, prevDailyAvg, true),
      sparkPts: (cur.timeSeries || []).map(b => exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense),
      note: `有支出 ${cur.activeDays || 0} 天` })
  }

  return cards.map(c => ({
    ...c,
    display: c.isPct ? `${c.val.toFixed(1)}%` : `¥${fmtMoney(c.val)}`,
  }))
})

function deltaText(cur, prev, invert, cmpWord, forceAbs) {
  const diff = cur - prev
  if (!prev && !cur) return '—'
  const ratio = prev !== 0 ? Math.abs(diff / prev) : Infinity
  if (forceAbs || ratio > 5) {
    if (Math.abs(diff) < 0.5) return '持平'
    return `${diff > 0 ? '▲' : '▼'} ¥${Math.round(Math.abs(diff))}`
  }
  if (Math.abs(diff / prev) < 0.0005) return '持平'
  return `${diff > 0 ? '▲' : '▼'} ${(ratio * 100).toFixed(1)}%`
}

function deltaClass(cur, prev, invert) {
  const diff = cur - prev
  if (!prev && !cur) return 'flat'
  if (Math.abs(diff) < 0.5) return 'flat'
  const up = diff > 0
  const good = invert ? !up : up
  return good ? 'good' : 'bad'
}

function sparkLine(pts) {
  const filtered = pts.filter(v => v != null)
  if (filtered.length < 2) return ''
  const max = Math.max(...filtered, 1)
  const step = 70 / (filtered.length - 1)
  return filtered.map((v, i) => `${(i * step).toFixed(1)},${(24 - (v / max) * (24 - 3) - 1.5).toFixed(1)}`).join(' ')
}

function sparkArea(pts) {
  const line = sparkLine(pts)
  if (!line) return ''
  return `${line} 70,24 0,24`
}

const trendGran = computed(() => periodRange.value.gran)

const trendBars = computed(() => {
  if (!rangeData.value) return []
  const ts = rangeData.value.cur.timeSeries || []
  if (!ts.length) return []
  const showInc = series.value === 'income' || series.value === 'compare'
  const showExp = series.value === 'expense' || series.value === 'compare'
  const expOf = b => exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense
  const maxV = Math.max(1, ...ts.map(b => Math.max(showExp ? expOf(b) : 0, showInc ? b.income : 0)))
  const nm = niceMax(maxV)
  const peakIdx = ts.reduce((best, b, i) => (expOf(b) > expOf(ts[best] || b) ? i : best), 0)
  const skip = ts.length > 16 ? Math.ceil(ts.length / (ts.length > 28 ? 10 : 8)) : 1

  return ts.map((b, i) => {
    const ev = expOf(b)
    return {
      label: b.label,
      expense: ev,
      income: b.income,
      expH: showExp ? Math.max(0, ev / nm * 100) : 0,
      incH: showInc ? Math.max(0, b.income / nm * 100) : 0,
      showExp, showInc,
      isPeak: showExp && i === peakIdx && series.value !== 'income' && ev > 0,
      weekend: b.weekend || false,
      future: b.future || false,
      zero: showExp && ev === 0 && !(showInc && b.income > 0),
      showLabel: i % skip === 0 || i === ts.length - 1,
    }
  })
})

function niceMax(v) {
  if (v <= 0) return 100
  const exp = Math.floor(Math.log10(v)), base = Math.pow(10, exp), f = v / base
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  return (steps.find(s => f <= s) || 10) * base
}

const gridLines = computed(() => {
  if (!rangeData.value) return [1, .75, .5, .25, 0].map(f => ({ label: f === 0 ? '0' : '' }))
  const ts = rangeData.value.cur.timeSeries || []
  const showInc = series.value === 'income' || series.value === 'compare'
  const showExp = series.value === 'expense' || series.value === 'compare'
  const expOf = b => exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense
  const maxV = Math.max(1, ...ts.map(b => Math.max(showExp ? expOf(b) : 0, showInc ? b.income : 0)))
  const nm = niceMax(maxV)
  return [1, .75, .5, .25, 0].map(f => ({ label: f === 0 ? '0' : compact(nm * f) }))
})

const avgVal = computed(() => {
  if (!rangeData.value) return 0
  const ts = rangeData.value.cur.timeSeries || []
  const live = ts.filter(b => !b.future)
  const valOf = b => series.value === 'income' ? b.income : (exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense)
  const sum = live.reduce((s, b) => s + valOf(b), 0)
  return sum / Math.max(1, live.length)
})

const avgPct = computed(() => {
  if (series.value === 'compare') return 0
  if (!rangeData.value) return 0
  const ts = rangeData.value.cur.timeSeries || []
  const showInc = series.value === 'income'
  const showExp = series.value === 'expense' || series.value === 'compare'
  const expOf = b => exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense
  const maxV = Math.max(1, ...ts.map(b => Math.max(showExp ? expOf(b) : 0, showInc ? b.income : 0)))
  const nm = niceMax(maxV)
  return Math.min(100, avgVal.value / nm * 100)
})

const trendSub = computed(() => {
  if (!rangeData.value) return ''
  const ts = rangeData.value.cur.timeSeries || []
  const live = ts.filter(b => !b.future)
  const unit = trendGran.value === 'day' ? '天' : '个月'
  let txt = `${trendGran.value === 'day' ? '按日' : '按月'}统计 · ${live.length} ${unit}`
  if (exFixed.value && series.value !== 'income') txt += ' · 已剔除固定支出'
  return txt
})

const seriesLabel = computed(() => {
  if (series.value === 'compare') return '支出/收入'
  return series.value === 'income' ? '收入' : '支出'
})

const peakLabel = computed(() => {
  if (!rangeData.value) return '—'
  const ts = rangeData.value.cur.timeSeries || []
  const valOf = b => series.value === 'income' ? b.income : (exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense)
  const top = ts.slice().sort((a, b) => valOf(b) - valOf(a))[0]
  return top ? `${top.label} ¥${Math.round(valOf(top))}` : '—'
})

const seriesTotal = computed(() => {
  if (!rangeData.value) return '0'
  const ts = rangeData.value.cur.timeSeries || []
  const valOf = b => series.value === 'income' ? b.income : (exFixed.value ? Math.max(0, b.expense - (b.fixed || 0)) : b.expense)
  return Math.round(ts.reduce((s, b) => s + valOf(b), 0)).toLocaleString('zh-CN')
})

const donutTotal = computed(() => {
  if (!rangeData.value) return 0
  const list = catType.value === 'expense' ? (rangeData.value.cur.byCategory || []) : (rangeData.value.cur.byIncomeCategory || [])
  return list.reduce((s, c) => s + (c.total || 0), 0)
})

const donutSegments = computed(() => {
  if (!rangeData.value) return []
  const list = catType.value === 'expense' ? (rangeData.value.cur.byCategory || []) : (rangeData.value.cur.byIncomeCategory || [])
  const total = donutTotal.value
  if (total <= 0) return []
  const R = 62, C = 2 * Math.PI * R
  const top = list.slice(0, 6)
  const restTotal = list.slice(6).reduce((s, c) => s + (c.total || 0), 0)
  const slices = [...top.map((c, i) => ({ ...c, idx: i }))]
  if (restTotal > 0) slices.push({ id: 'other', name: `其他 ${list.length - 6} 类`, icon: '📦', total: restTotal, idx: slices.length })

  let off = 0
  return slices.map((s, i) => {
    const len = s.total / total * C
    const seg = { idx: s.idx, name: `${s.icon || ''} ${s.name || '其他'}`, total: s.total, color: PAL[i % PAL.length], len, off: -off, pct: (s.total / total * 100).toFixed(1) }
    off += len
    return seg
  })
})

const donutSub = computed(() => {
  if (!rangeData.value) return ''
  const list = catType.value === 'expense' ? (rangeData.value.cur.byCategory || []) : (rangeData.value.cur.byIncomeCategory || [])
  return `${list.length} 个一级分类 · ${catType.value === 'expense' ? '支出' : '收入'}口径`
})

const rankList = computed(() => {
  if (!rangeData.value) return []
  const isExp = catType.value === 'expense'
  const list = isExp ? (rangeData.value.cur.byCategory || []) : (rangeData.value.cur.byIncomeCategory || [])
  const total = list.reduce((s, c) => s + (c.total || 0), 0)
  const maxV = Math.max(1, list[0]?.total || 1)
  return list.slice(0, 8).map((c, i) => ({
    idx: c.id || i, name: c.name, icon: c.icon || '📄', total: c.total,
    color: PAL[i % PAL.length], barW: (c.total / maxV * 100).toFixed(1),
    pct: total > 0 ? (c.total / total * 100).toFixed(1) : '0',
    children: (c.children || []).map(k => ({
      name: k.name, total: k.total,
      barW: (k.total / maxV * 100).toFixed(1),
    })),
  }))
})

function toggleRank(idx) {
  const s = new Set(openRanks.value)
  s.has(idx) ? s.delete(idx) : s.add(idx)
  openRanks.value = s
}


const mxSummaryCards = computed(() => {
  if (!matrixData.value.length) return []
  const data = matrixData.value
  const grand = data.reduce((s, p) => s + (p.children || []).reduce((ss, c) => ss + c.total, 0), 0)
  const monthTotals = Array.from({ length: 12 }, (_, i) => data.reduce((s, p) => s + (p.children || []).reduce((ss, c) => ss + (c['m' + (i + 1)] || 0), 0), 0))
  const peakM = monthTotals.indexOf(Math.max(...monthTotals))
  const elapsed = periodRange.value.inp ? TODAY.getMonth() + 1 : 12
  return [
    { label: '年度总支出', value: `¥${Math.round(grand).toLocaleString('zh-CN')}` },
    { label: '涉及分类', value: `${data.reduce((s, p) => s + (p.children || []).length, 0)} 个二级 / ${data.length} 个一级` },
    { label: '最高月份', value: `${peakM + 1}月 · ¥${Math.round(monthTotals[peakM] || 0).toLocaleString('zh-CN')}` },
    { label: '月均支出', value: `¥${Math.round(grand / Math.max(1, elapsed)).toLocaleString('zh-CN')}` },
  ]
})

const mxRowCount = computed(() => matrixData.value.reduce((s, p) => s + (p.children || []).length, 0))

const mxPeakMonth = computed(() => {
  if (!matrixData.value.length) return 0
  const data = matrixData.value
  const monthTotals = Array.from({ length: 12 }, (_, i) => data.reduce((s, p) => s + (p.children || []).reduce((ss, c) => ss + (c['m' + (i + 1)] || 0), 0), 0))
  const peak = Math.max(...monthTotals)
  return peak > 0 ? monthTotals.indexOf(peak) + 1 : 0
})

const mxGrandTotal = computed(() => {
  if (!matrixData.value.length) return 0
  return matrixData.value.reduce((s, p) => s + (p.children || []).reduce((ss, c) => ss + c.total, 0), 0)
})

function mxParentMonth(p, m) {
  return (p.children || []).reduce((s, c) => s + (c['m' + m] || 0), 0)
}

function mxParentTotal(p) {
  return (p.children || []).reduce((s, c) => s + c.total, 0)
}

function mxGrandMonth(m) {
  if (!matrixData.value.length) return 0
  return matrixData.value.reduce((s, p) => s + (p.children || []).reduce((ss, c) => ss + (c['m' + m] || 0), 0), 0)
}

function mxVars(p) {
  const color = PAL[matrixData.value.indexOf(p) % PAL.length] || getCssVar('--terracotta')
  return { '--ga': color }
}

function mxHeatStyle(v, p) {
  if (!v || v <= 0 || !mxHeat.value) return {}
  const data = matrixData.value
  const maxCell = Math.max(1, ...data.flatMap(p => (p.children || []).flatMap(c => Array.from({ length: 12 }, (_, i) => c['m' + (i + 1)] || 0))))
  const color = getCssVar('--terracotta')
  const opacity = (0.07 + 0.46 * Math.pow(v / maxCell, 0.62)).toFixed(3)
  try {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
    return { background: `rgba(${r},${g},${b},${opacity})` }
  } catch { return {} }
}

function heatScaleColor(n) {
  const color = getCssVar('--terracotta')
  const opacity = (0.07 + 0.46 * Math.pow(n / 3, 0.62)).toFixed(3)
  try {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${opacity})`
  } catch { return 'var(--border)' }
}

function toggleMxCollapse(id) {
  const s = new Set(mxCollapsed.value)
  s.has(id) ? s.delete(id) : s.add(id)
  mxCollapsed.value = s
}

function toggleMxExpand() {
  if (mxExpandAll.value) {
    mxCollapsed.value = new Set()
  } else {
    mxCollapsed.value = new Set(matrixData.value.map(p => p.id))
  }
  mxExpandAll.value = !mxExpandAll.value
}

function goToMonth(m, parentName, childName) {
  const y = matrixYear.value
  const ym = `${y}-${pad(m)}`
  router.push({ path: '/accounting', query: { month: ym, categoryName: childName } })
}


watch([mode, anchor, matrixYear, customStart, customEnd], () => {
  if (mode.value === 'matrix') loadMatrix()
  else loadData()
}, { immediate: true })

watch(() => store.currentBookId, (id) => {
  if (id) {
    if (mode.value === 'matrix') loadMatrix()
    else loadData()
  }
})

onMounted(() => { nextTick(() => { animReady.value = true }) })
</script>

<style scoped>
.rpt-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.page-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.period_bar, .period-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 11px 13px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
.seg { display: flex; gap: 3px; background: var(--bg-card-alt); border: 1px solid var(--border-light); padding: 4px; border-radius: 14px; overflow-x: auto; scrollbar-width: none; max-width: 100%; }
.seg::-webkit-scrollbar { display: none; }
.seg button { padding: 9px 15px; border-radius: 11px; border: none; background: transparent; color: var(--text-secondary); font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .25s; }
.seg button:hover { color: var(--text-primary); }
.seg button.on { background: var(--bg-card); color: var(--primary-dark); box-shadow: 0 3px 10px rgba(var(--shadow-rgb), .16); }

.range-box { display: flex; align-items: center; gap: 8px; }
.range-sep { color: var(--text-muted); font-size: 12.5px; }
.date-in { padding: 8px 11px; border-radius: 11px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; outline: none; }
.date-in:focus { border-color: var(--primary); }

.time-nav { display: flex; align-items: center; gap: 7px; margin-left: auto; }
.tn-btn { width: 34px; height: 34px; border-radius: 11px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; transition: all .25s; }
.tn-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary-dark); }
.tn-btn:disabled { opacity: .35; cursor: not-allowed; }
.tn-label { min-width: 132px; text-align: center; font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.25; }
.tn-sub { display: block; font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }

.quick-row { display: flex; gap: 6px; flex-wrap: wrap; width: 100%; }
.q-chip { padding: 6px 11px; border-radius: 999px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .22s; }
.q-chip:hover { border-color: var(--primary); color: var(--primary-dark); }
.q-chip.on { background: var(--primary); border-color: var(--primary); color: #fff; }

.btn.ghost.sm { padding: 8px 13px; font-size: 12.5px; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.kpi { position: relative; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 17px 18px; box-shadow: var(--shadow-sm); transition: transform .32s, box-shadow .32s; }
.kpi:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.kpi::after { content: ''; position: absolute; right: -34px; top: -34px; width: 104px; height: 104px; border-radius: 50%; background: var(--kc, var(--primary)); opacity: .1; }
.kpi:hover::after { opacity: .17; }
.kpi-top { display: flex; align-items: center; gap: 9px; margin-bottom: 11px; }
.kpi-ico { width: 31px; height: 31px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff; background: var(--kc, var(--primary)); flex-shrink: 0; }
.kpi-label { font-size: 12.5px; color: var(--text-secondary); font-weight: 600; }
.kpi-val { font-size: 25px; font-weight: 800; color: var(--kc, var(--text-primary)); font-variant-numeric: tabular-nums; line-height: 1.15; }
.kpi-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; min-height: 24px; }
.delta { font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.delta.good { background: rgba(var(--sage-rgb), .16); color: var(--sage-d); }
.delta.bad { background: rgba(var(--rose-rgb), .16); color: var(--rose-d); }
.delta.flat { background: var(--bg-card-alt); color: var(--text-secondary); }
.kpi-note { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
.spark { width: 70px; height: 24px; overflow: visible; }
.spark polyline { fill: none; stroke: var(--kc, var(--primary)); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.spark polygon { fill: var(--kc, var(--primary)); opacity: .14; }

.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 20px; box-shadow: var(--shadow-sm); }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.card-title { font-size: 15.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.card-sub { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.chips { display: flex; gap: 5px; background: var(--bg-card-alt); padding: 3px; border-radius: 11px; border: 1px solid var(--border-light); }
.chips button { padding: 6px 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 12.5px; font-weight: 600; border-radius: 9px; cursor: pointer; transition: all .22s; white-space: nowrap; }
.chips button:hover { color: var(--text-primary); }
.chips button.on { background: var(--bg-card); color: var(--primary-dark); box-shadow: 0 2px 8px rgba(var(--shadow-rgb), .14); }

.grid-2 { display: grid; grid-template-columns: 1.42fr 1fr; gap: 16px; margin-bottom: 16px; }
.grid-2b { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16px; margin-bottom: 16px; }

.trend-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toggle { display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .22s; }
.toggle:hover { border-color: var(--primary); color: var(--primary-dark); }
.toggle.on { background: var(--tag-bg); border-color: var(--tag-border); color: var(--primary-dark); }
.toggle i { width: 9px; height: 9px; border-radius: 50%; background: currentColor; opacity: .4; }
.toggle.on i { opacity: 1; }

.chart { position: relative; height: 268px; padding-left: 54px; }
.glines { position: absolute; left: 54px; right: 0; top: 0; bottom: 24px; display: flex; flex-direction: column; justify-content: space-between; }
.gl { border-top: 1px dashed var(--border-light); position: relative; height: 0; }
.gl:first-child { border-top-style: solid; border-top-color: var(--border); }
.gl span { position: absolute; left: -54px; top: -8px; width: 46px; text-align: right; font-size: 10.5px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.cols { position: absolute; left: 54px; right: 0; top: 0; bottom: 0; display: flex; align-items: stretch; gap: 2px; }
.col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; border-radius: 7px; cursor: default; transition: background .2s; position: relative; }
.col:hover { background: var(--hover-overlay); }
.col-tip { display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 7px 10px; font-size: 11.5px; white-space: nowrap; z-index: 10; box-shadow: var(--shadow-sm); pointer-events: none; }
.col:hover .col-tip { display: block; }
.tip-date { font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
.tip-row { line-height: 1.5; }
.col .pair { width: 100%; height: calc(100% - 24px); display: flex; align-items: flex-end; justify-content: center; gap: 2px; padding: 0 1px; }
.bar { width: 100%; max-width: 22px; border-radius: 5px 5px 2px 2px; transition: height .85s cubic-bezier(.22, 1, .36, 1); }
.bar.exp { background: linear-gradient(180deg, var(--rose), var(--rose-d)); }
.bar.inc { background: linear-gradient(180deg, var(--sage), var(--sage-d)); }
.bar.peak { background: linear-gradient(180deg, var(--amber), var(--amber-d)); }
.col:hover .bar { filter: brightness(1.07); }
.col-lbl { height: 24px; line-height: 24px; font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; max-width: 100%; text-align: center; }
.col.weekend .col-lbl { color: var(--primary-dark); font-weight: 700; }
.col.future { opacity: .4; }
.col.zero .bar { height: 2px !important; background: var(--border); border-radius: 2px; }
.avg-line { position: absolute; left: 54px; right: 0; border-top: 1.5px dashed var(--amber-d); opacity: .75; pointer-events: none; }
.avg-tag { position: absolute; right: 0; top: -9px; background: var(--bg-card); border: 1px solid var(--amber-d); color: var(--amber-d); font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 999px; white-space: nowrap; }
.chart-foot { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 14px; padding-top: 13px; border-top: 1px dashed var(--border-light); font-size: 12px; color: var(--text-secondary); }
.chart-foot b { color: var(--text-primary); font-weight: 700; }
.lg-inline { display: flex; align-items: center; gap: 6px; }
.lg-inline i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }

.donut-wrap { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.donut { position: relative; width: 164px; height: 164px; flex-shrink: 0; }
.donut svg { transform: rotate(-90deg); }
.donut .seg-c { cursor: pointer; transition: stroke-width .22s, opacity .22s; }
.donut:hover .seg-c { opacity: .42; }
.donut .seg-c:hover { opacity: 1; stroke-width: 27; }
.donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.dc-num { font-size: 20px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.dc-lbl { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.legend { flex: 1; min-width: 158px; display: flex; flex-direction: column; gap: 2px; }
.lg { display: flex; align-items: center; gap: 9px; font-size: 13px; padding: 5px 7px; border-radius: 9px; cursor: default; transition: background .2s; }
.lg:hover { background: var(--hover-overlay); }
.lg-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.lg-name { color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lg-val { margin-left: auto; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.lg-pct { font-size: 11.5px; color: var(--text-muted); min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 12px 4px; }

.rank { display: flex; flex-direction: column; gap: 3px; }
.rank-item { border-radius: 12px; }
.rank-row { display: flex; align-items: center; gap: 11px; padding: 9px 10px; cursor: pointer; border-radius: 12px; transition: background .22s; }
.rank-row:hover { background: var(--hover-overlay); }
.rank-num { width: 24px; height: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.rank-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); min-width: 88px; display: flex; align-items: center; gap: 6px; }
.rank-bar { flex: 1; height: 8px; border-radius: 4px; background: var(--bg-card-alt); overflow: hidden; min-width: 40px; }
.rank-bar i { display: block; height: 100%; width: 0; border-radius: 4px; transition: width 1s cubic-bezier(.22, 1, .36, 1); }
.rank-val { font-size: 13px; font-weight: 700; color: var(--text-primary); min-width: 74px; text-align: right; font-variant-numeric: tabular-nums; }
.rank-pct { font-size: 11.5px; color: var(--text-muted); min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
.rank-caret { font-size: 10px; color: var(--text-muted); transition: transform .25s; width: 10px; }
.sub-rank { display: none; padding: 2px 10px 10px 45px; flex-direction: column; gap: 6px; }
.rank-item.open .sub-rank { display: flex; }
.sub-item { display: flex; align-items: center; gap: 9px; font-size: 12.5px; }
.sub-name { color: var(--text-secondary); min-width: 78px; }
.sub-bar { flex: 1; height: 6px; border-radius: 3px; background: var(--bg-card-alt); overflow: hidden; }
.sub-bar i { display: block; height: 100%; width: 0; border-radius: 3px; transition: width .8s cubic-bezier(.22, 1, .36, 1); }
.sub-val { color: var(--text-primary); font-weight: 600; min-width: 70px; text-align: right; font-variant-numeric: tabular-nums; }


.mx-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.mx-stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 15px 17px; box-shadow: var(--shadow-sm); }
.mx-l { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.mx-v { font-size: 21px; font-weight: 800; color: var(--primary-dark); font-variant-numeric: tabular-nums; }
.mx-tools { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 13px; }
.mx-hint { margin-left: auto; font-size: 12px; color: var(--text-muted); }
.mx-scroll { overflow: auto; max-height: 660px; border-radius: 15px; border: 1px solid var(--border-light); background: var(--bg-card); }
.mx-scroll::-webkit-scrollbar { height: 9px; width: 9px; }
.mx-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

table.mx { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 1120px; font-size: 12.5px; }
.mx th, .mx td { padding: 9px 8px; text-align: right; white-space: nowrap; border-bottom: 1px solid var(--border-light); font-variant-numeric: tabular-nums; }
.mx thead th { position: sticky; top: 0; z-index: 3; background: var(--bg-card-alt); color: var(--text-secondary); font-weight: 700; font-size: 11.5px; border-bottom: 1.5px solid var(--border); }
.mx .s1 { position: sticky; left: 0; z-index: 2; text-align: left; width: 130px; min-width: 130px; background: var(--bg-card); }
.mx .s2 { position: sticky; left: 130px; z-index: 2; text-align: left; width: 132px; min-width: 132px; background: var(--bg-card); box-shadow: 6px 0 8px -6px rgba(var(--shadow-rgb), .28); }
.mx thead .s1, .mx thead .s2 { z-index: 5; background: var(--bg-card-alt); }
.mx .cell-parent { font-weight: 700; color: var(--text-primary); font-size: 13px; cursor: pointer; user-select: none; border-right: 3px solid var(--ga, var(--primary)); }
.mx .caret { display: inline-block; width: 12px; color: var(--text-muted); font-size: 10px; transition: transform .22s; }
.mx tr.collapsed .caret { transform: rotate(-90deg); }
.mx tr.prow td { font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border); }
.mx tr.prow:hover td { background: var(--hover-overlay); }
.mx .cell-psum { color: var(--text-secondary); font-size: 11.5px; font-weight: 600; cursor: pointer; user-select: none; }
.mx td.pamt { color: var(--text-primary); font-weight: 700; }
.mx .cell-sub { color: var(--text-secondary); padding-left: 22px; font-weight: 400; }
.mx .cell-sub::before { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--ga, var(--text-muted)); margin-right: 8px; vertical-align: middle; opacity: .6; }
.mx tr.crow:hover td { background: var(--hover-overlay); }
.mx td.amt { color: var(--text-secondary); cursor: pointer; transition: color .18s, box-shadow .18s; }
.mx td.amt.has:hover { color: var(--text-primary); font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--ga, var(--primary)); }
.mx td.amt.none { color: var(--text-muted); cursor: default; opacity: .55; }
.mx td.rowtotal { font-weight: 700; color: var(--text-primary); border-left: 1.5px solid var(--border); }
.mx td.ptotal { font-weight: 800; color: var(--ga, var(--primary-dark)); border-left: 1.5px solid var(--border); font-size: 13px; }
.mx tr.gtotal td { position: sticky; bottom: 0; z-index: 2; background: var(--bg-card-alt); font-weight: 800; border-top: 2px solid var(--primary); color: var(--text-primary); }
.mx tr.gtotal td.s1, .mx tr.gtotal td.s2 { z-index: 4; background: var(--bg-card-alt); }
.mx tr.gtotal td.hi { color: var(--rose-d); }
.mx-empty { padding: 48px; text-align: center; color: var(--text-muted); font-size: 13px; }
.mx-note { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 12px; font-size: 11.5px; color: var(--text-muted); }
.heat-scale { display: flex; align-items: center; gap: 5px; }
.heat-scale i { width: 22px; height: 9px; border-radius: 2px; display: inline-block; }

@media (max-width: 1180px) {
  .grid-2, .grid-2b { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .mx-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 820px) {
  .time-nav { margin-left: 0; width: 100%; justify-content: center; }
  .chart { height: 230px; padding-left: 46px; }
  .glines, .cols, .avg-line { left: 46px; }
  .gl span { left: -46px; width: 40px; }
  table.mx { --c1: 104px; --c2: 112px; font-size: 11.5px; }
}
@media (max-width: 520px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi { padding: 14px; }
  .kpi-val { font-size: 20px; }
  .spark { display: none; }
  .mx-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
  .card { padding: 16px 14px; }
  .rank-name { min-width: 70px; font-size: 12.5px; }
  .rank-val { min-width: 62px; font-size: 12px; }
}
</style>

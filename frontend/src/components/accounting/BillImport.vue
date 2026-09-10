<template>
  <div class="bill-import">
    <!-- Step 1: 上传区 -->
    <div v-if="step === 'upload'" class="upload-section reveal">
      <div
        class="upload-zone"
        :class="{ dragover }"
        @click="fileInput?.click()"
        @dragover.prevent="dragover = true"
        @dragleave="dragover = false"
        @drop.prevent="onDrop"
      >
        <span class="uz-icon">📄</span>
        <h3>拖拽文件到此处，或点击选择文件</h3>
        <p>支持微信支付账单（.xlsx）和支付宝账单（.csv）</p>
        <div class="formats">
          <span class="fmt-tag wx">💚 微信账单 .xlsx</span>
          <span class="fmt-tag ali">💙 支付宝账单 .csv</span>
        </div>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="onFileChange" />
        <div v-if="parsing" class="progress-bar"><div class="progress-fill" :style="{ width: progress + '%' }"></div></div>
      </div>
    </div>

    <!-- Step 2: 审核区 -->
    <div v-if="step === 'review'" class="review-section">
      <!-- 解析信息 -->
      <div class="parse-info reveal">
        <span class="src-tag" :class="fileSource">{{ fileSource === 'wx' ? '💚 微信账单' : '💙 支付宝账单' }}</span>
        <div class="info-item"><span class="info-label">文件：</span><span class="info-val">{{ fileName }}</span></div>
        <div class="info-item"><span class="info-label">共</span><span class="info-val">{{ allRecords.length }}</span><span class="info-label">条记录</span></div>
        <div class="info-item"><span class="info-label">支出</span><span class="info-val">{{ expenseCount }}</span><span class="info-label">笔</span></div>
        <div class="info-item"><span class="info-label">收入</span><span class="info-val">{{ incomeCount }}</span><span class="info-label">笔</span></div>
      </div>

      <!-- 汇总 -->
      <div class="review-summary reveal">
        <div class="rev-card"><div class="rev-label">待导入</div><div class="rev-val cnt">{{ activeRecords.length }} 笔</div></div>
        <div class="rev-card"><div class="rev-label">支出合计</div><div class="rev-val exp">¥{{ summaryExpense.toFixed(2) }}</div></div>
        <div class="rev-card"><div class="rev-label">收入合计</div><div class="rev-val inc">¥{{ summaryIncome.toFixed(2) }}</div></div>
        <div class="rev-card"><div class="rev-label">已编辑</div><div class="rev-val neu">{{ editedCount }} 笔</div></div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar reveal">
        <div class="search-wrap">
          <span class="mag">🔍</span>
          <input v-model="searchKeyword" class="search-input" placeholder="搜索交易对方、商品说明..." />
        </div>
        <button class="chip-btn" :class="{ active: currentFilter === 'all' }" @click="currentFilter = 'all'">全部</button>
        <button class="chip-btn" :class="{ active: currentFilter === 'expense' }" @click="currentFilter = 'expense'">支出</button>
        <button class="chip-btn" :class="{ active: currentFilter === 'income' }" @click="currentFilter = 'income'">收入</button>
        <button class="chip-btn" :class="{ active: currentFilter === 'neutral' }" @click="currentFilter = 'neutral'">不计收支</button>
        <button class="chip-btn" :class="{ active: currentFilter === 'edited' }" @click="currentFilter = 'edited'">已编辑</button>
        <div class="filter-right">
          <button class="btn ghost sm" @click="resetAll">↩ 重置全部</button>
          <button class="btn ghost sm" @click="backToUpload">← 重新上传</button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="review-table-wrap reveal">
        <table class="review-table">
          <thead>
            <tr>
              <th style="width:40px"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
              <th>时间</th>
              <th>交易对方</th>
              <th>商品说明</th>
              <th>收支</th>
              <th>金额</th>
              <th>分类</th>
              <th>备注</th>
              <th style="width:70px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="9">
                <div class="empty-state"><span class="es-icon">🔍</span><h3>没有匹配的记录</h3><p>尝试调整筛选条件或搜索关键词</p></div>
              </td>
            </tr>
            <tr
              v-for="r in filteredRecords"
              :key="r.id"
              :class="{ deleted: r.deleted, edited: r.edited && !r.deleted }"
            >
              <td><input type="checkbox" :checked="r.selected" :disabled="r.deleted" @change="r.selected = $event.target.checked" /></td>
              <td class="td-time">{{ r.time?.substring(0, 16) }}</td>
              <td class="td-counterparty" :title="r.counterparty">{{ r.counterparty }}</td>
              <td class="td-desc" :title="r.description">{{ r.description }}</td>
              <td><span class="badge" :class="r.type">{{ typeLabel(r.type) }}</span></td>
              <td class="td-amount" :class="r.type">{{ amountDisplay(r) }}</td>
              <td>
                <select
                  class="cat-select"
                  :class="{ modified: r._catChanged }"
                  :value="r.categoryId"
                  @change="changeCategory(r, $event.target.value)"
                >
                  <option v-for="c in getCategoryList(r.type)" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span v-if="r._catChanged" class="edit-dot"></span>
              </td>
              <td>
                <input
                  class="note-input"
                  :class="{ 'has-note': r.note }"
                  :value="r.note"
                  placeholder="添加备注..."
                  @change="changeNote(r, $event.target.value)"
                />
              </td>
              <td>
                <div class="row-actions">
                  <button v-if="r.deleted" class="row-btn restore" title="恢复" @click="restoreRow(r)">↩</button>
                  <button v-else class="row-btn del" title="删除" @click="deleteRow(r)">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-bar reveal">
        <div class="stats">
          已选 <b>{{ selectedCount }}</b> 条 · 净额 <b :style="{ color: netAmount >= 0 ? 'var(--sage-d,#7E8862)' : 'var(--rose-d,#B06A6A)' }">¥{{ netAmount.toFixed(2) }}</b>
        </div>
        <div class="actions">
          <button class="btn ghost" @click="backToUpload">取消</button>
          <button class="btn primary" :disabled="selectedCount === 0 || importing" @click="confirmImport">
            {{ importing ? '导入中...' : '✅ 确认导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { accountingApi } from '@/api'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const props = defineProps({
  bookId: { type: [String, Number], default: null }
})

const emit = defineEmits(['imported'])

// ===== 分类数据（从 API 加载） =====
const expenseCategories = ref([])
const incomeCategories = ref([])
const ALI_CATEGORY_MAP = {
  '餐饮美食': '餐饮美食', '交通出行': '交通出行', '日用百货': '日用百货', '购物消费': '购物消费',
  '爱车养车': '爱车养车', '通讯网络': '通讯网络', '充值缴费': '充值缴费', '住房物业': '住房物业',
  '医疗健康': '医疗健康', '教育培训': '教育培训', '休闲娱乐': '休闲娱乐', '人情社交': '人情社交',
  '转账红包': '转账红包', '投资理财': '投资理财',
}
const WX_TYPE_MAP = {
  '商户消费': '餐饮美食', '转账': '转账红包', '亲属卡交易': '人情社交',
  '扫二维码付款': '餐饮美食', '群收款': '人情社交', '二维码收款': '其他收入',
}

// ===== 状态 =====
const step = ref('upload')
const parsing = ref(false)
const progress = ref(0)
const dragover = ref(false)
const fileInput = ref(null)
const fileSource = ref('')
const fileName = ref('')
const allRecords = ref([])
const currentFilter = ref('all')
const searchKeyword = ref('')
const importing = ref(false)

// ===== 渐入动画 =====
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
    document.querySelectorAll('.bill-import .reveal:not(.in)').forEach((el, i) => {
      if (!el.dataset.d) el.dataset.d = (i % 6) * 60
      el.style.transitionDelay = el.dataset.d + 'ms'
      revealIO.observe(el)
    })
  })
}

watch(step, () => { nextTick(() => observeReveal()) })

// ===== 加载分类 =====
const authStore = useAuthStore()
async function loadCategories() {
  try {
    const familyId = authStore.currentFamily?.id
    const [expRes, incRes] = await Promise.all([
      accountingApi.getCategories({ type: 'expense', familyId }),
      accountingApi.getCategories({ type: 'income', familyId }),
    ])
    expenseCategories.value = (expRes.data || []).filter(c => !c.parentId)
    incomeCategories.value = (incRes.data || []).filter(c => !c.parentId)
  } catch (e) { console.error('加载分类失败', e) }
}
onMounted(loadCategories)

// ===== 计算属性 =====
const expenseCount = computed(() => allRecords.value.filter(r => r.type === 'expense').length)
const incomeCount = computed(() => allRecords.value.filter(r => r.type === 'income').length)
const activeRecords = computed(() => allRecords.value.filter(r => !r.deleted))
const editedCount = computed(() => allRecords.value.filter(r => r.edited && !r.deleted).length)
const summaryExpense = computed(() => activeRecords.value.filter(r => r.type === 'expense').reduce((s, r) => s + Math.abs(r.amount), 0))
const summaryIncome = computed(() => activeRecords.value.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0))
const selectedCount = computed(() => allRecords.value.filter(r => !r.deleted && r.selected).length)
const netAmount = computed(() => {
  const active = allRecords.value.filter(r => !r.deleted && r.selected)
  return active.reduce((s, r) => s + (r.type === 'expense' ? -Math.abs(r.amount) : r.amount), 0)
})
const allChecked = computed(() => {
  const active = allRecords.value.filter(r => !r.deleted)
  return active.length > 0 && active.every(r => r.selected)
})

const filteredRecords = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return allRecords.value.filter(r => {
    if (currentFilter.value === 'expense' && r.type !== 'expense') return false
    if (currentFilter.value === 'income' && r.type !== 'income') return false
    if (currentFilter.value === 'neutral' && r.type !== 'neutral') return false
    if (currentFilter.value === 'edited' && (!r.edited || r.deleted)) return false
    if (kw) {
      const hay = (r.counterparty + r.description + r.note).toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

// ===== 工具函数 =====
function typeLabel(t) { return t === 'expense' ? '支出' : t === 'income' ? '收入' : '不计收支' }
function amountDisplay(r) { return r.type === 'expense' ? `-¥${Math.abs(r.amount).toFixed(2)}` : `+¥${r.amount.toFixed(2)}` }
function getCategoryList(type) { return type === 'income' ? incomeCategories.value : expenseCategories.value }

function matchCategory(name, type) {
  const list = getCategoryList(type)
  const found = list.find(c => c.name === name)
  if (found) return found
  // 回退：找"其他"类
  const fallback = list.find(c => c.name.includes('其他'))
  return fallback || (list.length > 0 ? list[list.length - 1] : { id: null, name: '其他' })
}

// ===== 文件上传 =====
function onDrop(e) {
  dragover.value = false
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0])
}
function onFileChange(e) {
  if (e.target.files.length) handleFile(e.target.files[0])
}

async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  parsing.value = true
  progress.value = 30
  fileName.value = file.name

  try {
    let records
    if (ext === 'csv') {
      const buffer = await file.arrayBuffer()
      progress.value = 60
      const text = decodeGBK(buffer)
      records = parseAlipayCSV(text)
      fileSource.value = 'ali'
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer()
      progress.value = 60
      records = await parseWechatXLSX(new Uint8Array(buffer))
      fileSource.value = 'wx'
    } else {
      throw new Error('不支持的文件格式，请上传 .xlsx 或 .csv 文件')
    }

    progress.value = 100
    await new Promise(r => setTimeout(r, 300))

    if (records.length === 0) {
      ElMessage.error('未解析到有效交易记录')
      parsing.value = false
      progress.value = 0
      return
    }

    allRecords.value = records
    step.value = 'review'
    ElMessage.success(`成功解析 ${records.length} 条${fileSource.value === 'wx' ? '微信' : '支付宝'}记录`)
  } catch (err) {
    ElMessage.error('文件解析失败: ' + err.message)
  } finally {
    parsing.value = false
    progress.value = 0
  }
}

// ===== GBK 解码 =====
function decodeGBK(buffer) {
  try { return new TextDecoder('gbk').decode(buffer) }
  catch { return new TextDecoder('gb2312').decode(buffer) }
}

// ===== 支付宝 CSV 解析 =====
function parseAlipayCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('交易时间,交易分类')) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('未找到支付宝账单表头')

  const records = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i])
    if (cols.length < 7 || !cols[0].match(/^\d{4}-/)) continue

    const direction = cols[5]?.trim()
    let type, amount
    if (direction === '支出') { type = 'expense'; amount = -Math.abs(parseFloat(cols[6])) }
    else if (direction === '收入') { type = 'income'; amount = Math.abs(parseFloat(cols[6])) }
    else { type = 'expense'; amount = -Math.abs(parseFloat(cols[6])) }

    const aliCategory = cols[1]?.trim() || ''
    const mappedCat = ALI_CATEGORY_MAP[aliCategory] || '其他'
    const matchedCat = matchCategory(mappedCat, type)

    records.push({
      id: records.length,
      time: cols[0]?.trim() || '',
      counterparty: cols[2]?.trim() || '',
      description: cols[4]?.trim() || '',
      type, amount,
      originalCategory: aliCategory,
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      note: cols[11]?.trim() || '',
      deleted: false, edited: false, selected: true, _catChanged: false,
      source: 'ali',
    })
  }
  return records
}

function splitCSV(line) {
  const result = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuote = !inQuote
    else if (ch === ',' && !inQuote) { result.push(current); current = '' }
    else current += ch
  }
  result.push(current)
  return result
}

// ===== 微信 XLSX 解析 =====
async function parseWechatXLSX(data) {
  const zip = await unzipAsync(data)
  const sharedStrings = []
  if (zip['xl/sharedStrings.xml']) {
    const xml = new TextDecoder().decode(zip['xl/sharedStrings.xml'])
    const siMatches = xml.matchAll(/<si>([\s\S]*?)<\/si>/g)
    for (const m of siMatches) {
      const textMatches = m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)
      let text = ''
      for (const t of textMatches) text += t[1]
      sharedStrings.push(decodeXMLEntities(text))
    }
  }

  const sheetXml = new TextDecoder().decode(zip['xl/worksheets/sheet1.xml'])
  const rowMatches = sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)
  const rows = []
  for (const rm of rowMatches) {
    const cells = {}
    const cellMatches = rm[1].matchAll(/<c\s+r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(?:<v>([\s\S]*?)<\/v>)?<\/c>)/g)
    for (const cm of cellMatches) {
      const col = cm[1]
      const attrs = cm[2]
      const val = cm[3] || ''
      const isString = attrs.includes('t="s"')
      const colIdx = colToIndex(col)
      cells[colIdx] = isString ? (sharedStrings[parseInt(val)] || val) : val
    }
    rows.push(cells)
  }

  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && (rows[i][0] === '交易时间' || rows[i][0]?.includes('交易时间'))) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('未找到微信账单表头')

  const records = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r[0]) continue

    let timeStr
    if (r[0].match(/^\d{4}-/)) {
      timeStr = r[0]
    } else {
      const serial = parseFloat(r[0])
      if (!isNaN(serial) && serial > 30000) timeStr = excelDateToSerial(serial)
      else continue
    }

    const direction = r[4]?.trim()
    let type, amount
    const rawAmount = parseFloat(r[5] || '0')
    if (direction === '支出') { type = 'expense'; amount = -Math.abs(rawAmount) }
    else if (direction === '收入') { type = 'income'; amount = Math.abs(rawAmount) }
    else { type = 'expense'; amount = -Math.abs(rawAmount) }

    const wxType = r[1]?.trim() || ''
    const mappedCat = WX_TYPE_MAP[wxType] || '其他'
    const matchedCat = matchCategory(mappedCat, type)

    records.push({
      id: records.length,
      time: timeStr,
      counterparty: r[2]?.trim() || '',
      description: r[3]?.trim() || '',
      type, amount,
      originalCategory: wxType,
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      note: (r[10] && r[10] !== '/') ? r[10]?.trim() : '',
      deleted: false, edited: false, selected: true, _catChanged: false,
      source: 'wx',
    })
  }
  return records
}

function colToIndex(col) {
  let idx = 0
  for (let i = 0; i < col.length; i++) idx = idx * 26 + (col.charCodeAt(i) - 64)
  return idx - 1
}

function excelDateToSerial(serial) {
  const utcDays = Math.floor(serial - 25569)
  const dateInfo = new Date(utcDays * 86400 * 1000)
  const fractionalDay = serial - Math.floor(serial) + 0.0000001
  let totalSeconds = Math.floor(86400 * fractionalDay)
  const seconds = totalSeconds % 60
  totalSeconds = Math.floor(totalSeconds / 60)
  const minutes = totalSeconds % 60
  const hours = Math.floor(totalSeconds / 60)
  const y = dateInfo.getUTCFullYear()
  const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dateInfo.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function decodeXMLEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

// ===== ZIP 解压（异步，使用 DecompressionStream） =====
async function unzipAsync(data) {
  const view = new DataView(data.buffer)
  const files = {}

  let eocdOffset = -1
  for (let i = data.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break }
  }
  if (eocdOffset === -1) throw new Error('Invalid ZIP')

  const cdOffset = view.getUint32(eocdOffset + 16, true)
  const cdEntries = view.getUint16(eocdOffset + 10, true)

  let offset = cdOffset
  for (let i = 0; i < cdEntries; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const method = view.getUint16(offset + 10, true)
    const compSize = view.getUint32(offset + 20, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = new TextDecoder().decode(data.slice(localOffset + 30, localOffset + 30 + nameLen))

    if (!name.endsWith('/')) {
      const localCompSize = view.getUint32(localOffset + 18, true)
      const localNameLen = view.getUint16(localOffset + 26, true)
      const localExtraLen = view.getUint16(localOffset + 28, true)
      const compData = data.slice(
        localOffset + 30 + localNameLen + localExtraLen,
        localOffset + 30 + localNameLen + localExtraLen + localCompSize
      )

      if (method === 0) {
        files[name] = compData
      } else if (method === 8) {
        try {
          files[name] = await inflateAsync(compData)
        } catch { files[name] = new Uint8Array() }
      }
    }
    offset += 46 + nameLen + extraLen + commentLen
  }
  return files
}

async function inflateAsync(compressed) {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  const reader = ds.readable.getReader()
  writer.write(compressed).then(() => writer.close())
  const chunks = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const totalLen = chunks.reduce((s, c) => s + c.length, 0)
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length }
  return result
}

// ===== 操作 =====
function deleteRow(r) { r.deleted = true; r.selected = false; r.edited = true }
function restoreRow(r) { r.deleted = false; r.selected = true }
function toggleAll(e) { allRecords.value.forEach(r => { if (!r.deleted) r.selected = e.target.checked }) }

function changeCategory(r, catId) {
  const catList = getCategoryList(r.type)
  const cat = catList.find(c => c.id === parseInt(catId))
  if (cat) {
    r.categoryId = cat.id
    r.categoryName = cat.name
    r.edited = true
    r._catChanged = true
  }
}

function changeNote(r, val) {
  r.note = val
  r.edited = true
}

function resetAll() {
  allRecords.value.forEach(r => {
    r.deleted = false
    r.edited = false
    r.selected = true
    r._catChanged = false
    const aliCat = ALI_CATEGORY_MAP[r.originalCategory]
    const wxType = WX_TYPE_MAP[r.originalCategory]
    const mapped = aliCat || wxType || '其他'
    const catList = getCategoryList(r.type)
    const cat = catList.find(c => c.name === mapped) || catList[catList.length - 1]
    r.categoryId = cat.id
    r.categoryName = cat.name
  })
  ElMessage.info('已重置所有修改')
}

function backToUpload() {
  step.value = 'upload'
  allRecords.value = []
  fileSource.value = ''
  fileName.value = ''
  currentFilter.value = 'all'
  searchKeyword.value = ''
}

async function confirmImport() {
  const selected = allRecords.value.filter(r => !r.deleted && r.selected)
  if (selected.length === 0) return ElMessage.warning('没有可导入的记录')

  importing.value = true
  try {
    const payload = selected.map(r => ({
      transactionDate: r.time?.substring(0, 10),
      type: r.type,
      amount: Math.abs(r.amount),
      categoryId: r.categoryId,
      note: r.note || '',
    }))
    const res = await accountingApi.importTransactions({
      bookId: props.bookId,
      transactions: payload,
    })
    ElMessage.success(`✅ 成功导入 ${res.data?.imported || payload.length} 条记录`)
    emit('imported')
    backToUpload()
  } catch (err) {
    ElMessage.error('导入失败: ' + (err.response?.data?.message || err.message))
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.bill-import { position: relative; }

/* ===== 上传区 ===== */
.upload-zone {
  background: var(--bg-card, #FFFDFA);
  border: 2px dashed var(--wood-light, #E2CDB2);
  border-radius: var(--radius-lg, 24px);
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.35s;
  position: relative;
  overflow: hidden;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--terracotta, #C89F85);
  background: rgba(200, 159, 133, 0.06);
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(160, 120, 90, 0.12);
}
.uz-icon { font-size: 48px; margin-bottom: 16px; display: block; }
.upload-zone h3 { font-size: 18px; font-weight: 700; color: var(--terra-deep, #96684A); margin-bottom: 8px; }
.upload-zone p { font-size: 13.5px; color: var(--text-secondary, #A08D7A); line-height: 1.7; }
.formats { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }
.fmt-tag { padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.fmt-tag.wx { background: #E8F5E9; color: #2E7D32; }
.fmt-tag.ali { background: #E3F2FD; color: #1565C0; }

/* 进度条 */
.progress-bar { height: 4px; background: var(--cream, #F3EADD); border-radius: 2px; overflow: hidden; margin-top: 12px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--terracotta, #C89F85), var(--amber, #E8B36A)); border-radius: 2px; transition: width 0.3s; }

/* ===== 解析信息 ===== */
.parse-info {
  background: var(--bg-card, #FFFDFA);
  border: 1px solid var(--border, rgba(226, 205, 178, 0.7));
  border-radius: var(--radius-lg, 24px);
  padding: 20px 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 6px 20px rgba(160, 120, 90, 0.07);
}
.info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.info-label { color: var(--text-secondary, #A08D7A); }
.info-val { font-weight: 700; color: var(--terra-deep, #96684A); }
.src-tag { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.src-tag.wx { background: #E8F5E9; color: #2E7D32; }
.src-tag.ali { background: #E3F2FD; color: #1565C0; }

/* ===== 汇总 ===== */
.review-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.rev-card {
  background: var(--bg-card, #FFFDFA);
  border: 1px solid var(--border, rgba(226, 205, 178, 0.7));
  border-radius: var(--radius-md, 16px);
  padding: 16px 18px;
  box-shadow: 0 4px 14px rgba(160, 120, 90, 0.06);
}
.rev-label { font-size: 12px; color: var(--text-secondary, #A08D7A); margin-bottom: 4px; }
.rev-val { font-size: 22px; font-weight: 800; }
.rev-val.exp { color: var(--rose-d, #B06A6A); }
.rev-val.inc { color: var(--sage-d, #7E8862); }
.rev-val.neu { color: var(--text-secondary, #A08D7A); }
.rev-val.cnt { color: var(--terra-deep, #96684A); }

/* ===== 筛选 ===== */
.filter-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 300px; }
.search-wrap .mag { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; }
.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 12px;
  border: 1.5px solid var(--wood-light, #E2CDB2);
  background: #FFFDF9;
  font-size: 13.5px;
  color: var(--text-primary, #6B5744);
  font-family: inherit;
  outline: none;
  transition: all 0.3s;
}
.search-input:focus { border-color: var(--terracotta, #C89F85); box-shadow: 0 0 0 3px rgba(200, 159, 133, 0.12); }
.chip-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--border, rgba(226, 205, 178, 0.7));
  background: rgba(255, 253, 250, 0.8);
  color: var(--text-secondary, #A08D7A);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}
.chip-btn:hover { border-color: var(--terracotta, #C89F85); color: var(--terra-deep, #96684A); }
.chip-btn.active { background: var(--terracotta, #C89F85); border-color: var(--terracotta, #C89F85); color: #fff; }
.filter-right { margin-left: auto; display: flex; gap: 8px; }

/* ===== 表格 ===== */
.review-table-wrap {
  background: var(--bg-card, #FFFDFA);
  border: 1px solid var(--border, rgba(226, 205, 178, 0.7));
  border-radius: var(--radius-lg, 24px);
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(160, 120, 90, 0.08);
}
.review-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.review-table thead { background: rgba(243, 234, 221, 0.5); }
.review-table th { padding: 13px 14px; text-align: left; font-weight: 600; color: var(--terra-deep, #96684A); font-size: 12.5px; border-bottom: 1.5px solid var(--border, rgba(226, 205, 178, 0.7)); white-space: nowrap; }
.review-table td { padding: 12px 14px; border-bottom: 1px solid rgba(226, 205, 178, 0.4); vertical-align: middle; }
.review-table tr:last-child td { border-bottom: none; }
.review-table tr:hover { background: rgba(200, 159, 133, 0.04); }
.review-table tr.deleted { opacity: 0.35; text-decoration: line-through; }
.review-table tr.edited { background: rgba(232, 179, 106, 0.06); }

.td-amount { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-amount.expense { color: var(--rose-d, #B06A6A); }
.td-amount.income { color: var(--sage-d, #7E8862); }
.td-amount.neutral { color: var(--text-secondary, #A08D7A); }
.td-time { white-space: nowrap; color: var(--text-secondary, #A08D7A); font-size: 12.5px; }
.td-counterparty { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary, #A08D7A); font-size: 12.5px; }

/* 分类选择 */
.cat-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--border, rgba(226, 205, 178, 0.7));
  background: #FFFDF9;
  font-size: 12.5px;
  color: var(--text-primary, #6B5744);
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: all 0.25s;
  min-width: 90px;
}
.cat-select:focus { border-color: var(--terracotta, #C89F85); box-shadow: 0 0 0 3px rgba(200, 159, 133, 0.12); }
.cat-select.modified { border-color: var(--amber, #E8B36A); background: rgba(232, 179, 106, 0.08); }

/* 备注输入 */
.note-input {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  background: transparent;
  font-size: 12.5px;
  color: var(--text-primary, #6B5744);
  font-family: inherit;
  outline: none;
  width: 120px;
  transition: all 0.25s;
}
.note-input:hover { border-color: var(--border, rgba(226, 205, 178, 0.7)); background: #FFFDF9; }
.note-input:focus { border-color: var(--terracotta, #C89F85); background: #FFFDF9; box-shadow: 0 0 0 3px rgba(200, 159, 133, 0.12); width: 160px; }
.note-input.has-note { border-color: var(--border, rgba(226, 205, 178, 0.7)); background: #FFFDF9; }

/* 行操作 */
.row-actions { display: flex; gap: 6px; }
.row-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  transition: all 0.25s; background: transparent; color: var(--text-secondary, #A08D7A);
}
.row-btn:hover { transform: scale(1.15); }
.row-btn.del:hover { background: rgba(217, 154, 154, 0.15); color: var(--rose-d, #B06A6A); }
.row-btn.restore:hover { background: rgba(168, 176, 138, 0.15); color: var(--sage-d, #7E8862); }

.badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge.expense { background: rgba(217, 154, 154, 0.15); color: var(--rose-d, #B06A6A); }
.badge.income { background: rgba(168, 176, 138, 0.15); color: var(--sage-d, #7E8862); }
.badge.neutral { background: rgba(160, 141, 122, 0.12); color: var(--text-secondary, #A08D7A); }
.edit-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber, #E8B36A); display: inline-block; margin-left: 4px; vertical-align: middle; }

/* 底部操作栏 */
.bottom-bar {
  position: sticky; bottom: 0; z-index: 10;
  background: rgba(255, 252, 247, 0.92);
  backdrop-filter: blur(18px) saturate(1.4);
  border-top: 1px solid var(--border, rgba(226, 205, 178, 0.7));
  padding: 14px 0;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.stats { font-size: 13.5px; color: var(--text-secondary, #A08D7A); }
.stats b { color: var(--terra-deep, #96684A); }
.actions { display: flex; gap: 10px; }

/* 空状态 */
.empty-state { text-align: center; padding: 60px 20px; }
.es-icon { font-size: 56px; margin-bottom: 16px; display: block; opacity: 0.6; }
.empty-state h3 { font-size: 17px; font-weight: 700; color: var(--terra-deep, #96684A); margin-bottom: 8px; }
.empty-state p { font-size: 13.5px; color: var(--text-secondary, #A08D7A); }

/* 按钮 */
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.3s, box-shadow 0.3s; }
.btn.primary { background: linear-gradient(135deg, var(--terracotta, #C89F85), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4); }
.btn.ghost { background: rgba(255, 253, 250, 0.85); color: var(--terra-deep, #96684A); border: 1.5px solid var(--border, rgba(226, 205, 178, 0.7)); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.3); }
.btn:active { transform: translateY(-1px) scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
.btn.sm { padding: 7px 14px; font-size: 13px; border-radius: 10px; }

/* 渐入 */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.reveal.in { opacity: 1; transform: none; }

/* 响应式 */
@media (max-width: 768px) {
  .review-summary { grid-template-columns: repeat(2, 1fr); }
  .review-table-wrap { overflow-x: auto; }
  .review-table { min-width: 800px; }
  .parse-info { flex-direction: column; align-items: flex-start; }
  .filter-right { margin-left: 0; width: 100%; }
}
</style>

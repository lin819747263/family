<template>
  <div class="txn-form">
    <!-- 类型切换 -->
    <div class="type-bar">
      <button class="type-tab" :class="{ active: form.type === 'expense' }" @click="form.type = 'expense'; onTypeChange()">
        <span class="type-icon expense">📉</span>支出
      </button>
      <button class="type-tab" :class="{ active: form.type === 'income' }" @click="form.type = 'income'; onTypeChange()">
        <span class="type-icon income">📈</span>收入
      </button>
      <div class="type-indicator" :class="form.type"></div>
    </div>

    <!-- 金额输入 -->
    <div class="amount-box" :class="form.type">
      <span class="amount-currency">¥</span>
      <input
        ref="amountInput"
        v-model="form.amount"
        type="text"
        step="0.01"
        placeholder="0.00"
        class="amount-field"
        inputmode="decimal"
        @input="onAmountInput"
      />
      <button
        v-if="voiceSupported"
        class="voice-btn"
        :class="{ listening: voiceListening }"
        @click="toggleVoice"
        :title="voiceListening ? '点击停止' : '语音记账'"
      >
        <el-icon :size="20"><Microphone /></el-icon>
      </button>
      <div class="amount-line"></div>
    </div>
    <div v-if="voiceListening" class="voice-hint">
      <span class="voice-pulse"></span>
      <span>正在聆听… 请说"午饭花了35"或"收到工资8000"</span>
    </div>
    <div v-if="voiceResult" class="voice-result">
      <span>🎤 {{ voiceResult }}</span>
      <button class="voice-result-close" @click="voiceResult = ''">✕</button>
    </div>

    <!-- 分类选择（下拉框） -->
    <div class="cat-select-row">
      <span class="detail-label">📂 分类</span>
      <el-select v-model="form.categoryId" placeholder="选择分类" style="flex:1;" filterable size="large">
        <template v-for="group in categoryTree" :key="group.id">
          <el-option-group v-if="group.children?.length" :label="group.name">
            <el-option
              v-for="child in group.children"
              :key="child.id"
              :label="`${group.name} / ${child.name}`"
              :value="child.id"
            >
              <span style="display:flex;align-items:center;gap:6px;">
                <span style="color:#94a3b8;font-size:12px;">{{ group.name }}</span>
                <span>{{ child.name }}</span>
              </span>
            </el-option>
          </el-option-group>
          <el-option v-else :key="group.id" :label="group.name" :value="group.id" />
        </template>
      </el-select>
    </div>

    <!-- 详情区域 -->
    <div class="detail-section">
      <!-- 账本 -->
      <div v-if="books.length > 1 && !isEdit" class="detail-row">
        <span class="detail-label">💰 账本</span>
        <el-select v-model="form.bookId" placeholder="选择账本" size="small" style="flex:1;">
          <el-option v-for="b in books" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
      </div>

      <!-- 日期 -->
      <div class="detail-row">
        <span class="detail-label">📅 日期</span>
        <el-date-picker
          v-model="form.transactionDate"
          type="date"
          size="small"
          style="flex:1;"
          value-format="YYYY-MM-DD"
          :clearable="false"
        />
      </div>

      <!-- 备注 -->
      <div class="detail-row">
        <span class="detail-label">✏️ 备注</span>
        <el-input v-model="form.note" placeholder="添加备注..." size="small" style="flex:1;" clearable />
      </div>
    </div>

    <!-- 提交按钮 -->
    <button class="submit-btn" :class="form.type" :disabled="loading" @click="handleSubmit">
      <span v-if="loading" class="btn-loading"></span>
      <span v-else>{{ isEdit ? '保存修改' : '确认记账' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { accountingApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { useAccountingStore } from '@/store/accounting'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// ===== 语音记账 =====
const voiceSupported = ref(false)
const voiceListening = ref(false)
const voiceResult = ref('')
let recognition = null

onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) {
    voiceSupported.value = true
    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      voiceResult.value = text
      parseVoiceInput(text)
      voiceListening.value = false
    }
    recognition.onerror = () => { voiceListening.value = false }
    recognition.onend = () => { voiceListening.value = false }
  }
})

function toggleVoice() {
  if (voiceListening.value) {
    recognition?.stop()
    voiceListening.value = false
  } else {
    try {
      recognition?.start()
      voiceListening.value = true
    } catch { /* already started */ }
  }
}

// 解析语音输入，提取金额、类型、备注
function parseVoiceInput(text) {
  // 提取金额：匹配数字（含小数）
  const amountMatch = text.match(/(\d+\.?\d*)/)
  if (amountMatch) {
    form.amount = amountMatch[1]
  }

  // 判断类型
  const incomeKeywords = ['工资', '收入', '收到', '进账', '报销', '退款', '红包', '奖金']
  if (incomeKeywords.some(k => text.includes(k))) {
    form.type = 'income'
  } else {
    form.type = 'expense'
  }

  // 尝试匹配分类
  const categoryMap = {
    '餐饮': ['吃饭', '午饭', '晚饭', '早餐', '外卖', '餐厅', '饭店', '火锅', '烧烤', '奶茶', '咖啡'],
    '交通': ['打车', '地铁', '公交', '加油', '停车', '高铁', '飞机', '机票'],
    '购物': ['买', '购物', '超市', '淘宝', '京东'],
    '医疗': ['医院', '药', '看病', '挂号'],
    '教育': ['学费', '书', '课程', '培训'],
    '娱乐': ['电影', '游戏', 'KTV', '旅游'],
    '住房': ['房租', '物业', '水电', '燃气'],
    '通讯': ['话费', '流量', '宽带'],
    '工资': ['工资', '薪水', '薪资'],
    '红包': ['红包'],
  }

  for (const [catName, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => text.includes(k))) {
      // 在分类列表中查找匹配的分类
      const matched = allCategories.value.find(c => c.name.includes(catName) && c.type === form.type)
      if (matched) {
        form.categoryId = matched.id
        break
      }
    }
  }

  // 备注使用原始文本
  form.note = text
}

const props = defineProps({
  editData: { type: Object, default: null }
})
const emit = defineEmits(['success'])
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const loading = ref(false)
const allCategories = ref([])
const books = ref([])
const amountInput = ref(null)

const isEdit = computed(() => !!props.editData)

const form = reactive({
  bookId: null, type: 'expense', amount: '', categoryId: '', transactionDate: dayjs().format('YYYY-MM-DD'), note: '', tags: ''
})

// 分类树
const categoryTree = computed(() => {
  const filtered = allCategories.value.filter(c => c.type === form.type)
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

watch(() => props.editData, (val) => {
  if (val) {
    form.bookId = val.bookId
    form.type = val.type
    form.amount = parseFloat(val.amount)
    form.categoryId = val.categoryId
    form.transactionDate = val.transactionDate
    form.note = val.note || ''
    form.tags = val.tags || ''
  }
}, { immediate: true })

onMounted(async () => {
  try {
    const [catRes, bookRes] = await Promise.all([
      accountingApi.getCategories({ familyId: authStore.currentFamily?.id }),
      accountingApi.getBooks({ familyId: authStore.currentFamily?.id })
    ])
    allCategories.value = catRes.data
    books.value = bookRes.data
    if (!isEdit.value) {
      if (accountingStore.currentBookId && bookRes.data.find(b => b.id === accountingStore.currentBookId)) {
        form.bookId = accountingStore.currentBookId
      } else if (bookRes.data.length === 1) {
        form.bookId = bookRes.data[0].id
      }
    }
    // 自动聚焦金额
    nextTick(() => amountInput.value?.focus())
  } catch { /* handled by interceptor */ }
})

function onTypeChange() {
  if (!isEdit.value) form.categoryId = ''
}

// 金额输入过滤：只允许数字和小数点，最多两位小数
function onAmountInput(e) {
  let val = e.target.value
  // 移除非数字和小数点字符
  val = val.replace(/[^\d.]/g, '')
  // 只保留第一个小数点
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
  // 限制两位小数
  if (parts[1] && parts[1].length > 2) val = parts[0] + '.' + parts[1].slice(0, 2)
  form.amount = val
}

async function handleSubmit() {
  if (!form.amount) return ElMessage.warning('请输入金额')
  if (!form.categoryId) return ElMessage.warning('请选择分类')
  if (!form.transactionDate) return ElMessage.warning('请选择日期')
  // 精确转换金额：字符串 → 数字，避免浮点精度问题
  const amount = Math.round(parseFloat(form.amount) * 100) / 100
  if (isNaN(amount) || amount <= 0) return ElMessage.warning('请输入有效金额')
  loading.value = true
  try {
    if (isEdit.value) {
      await accountingApi.updateTransaction(props.editData.id, {
        type: form.type, amount, categoryId: form.categoryId,
        transactionDate: form.transactionDate, note: form.note, tags: form.tags
      })
      ElMessage.success('修改成功')
    } else {
      if (!form.bookId) {
        const booksRes = await accountingApi.getBooks({ familyId: authStore.currentFamily?.id })
        if (!booksRes.data?.length) { ElMessage.warning('请先创建账本'); return }
        form.bookId = booksRes.data[0].id
      }
      await accountingApi.createTransaction({ ...form, amount })
      ElMessage.success('记账成功')
    }
    form.amount = ''; form.categoryId = ''; form.note = ''
    emit('success')
  } catch { /* handled */ }
  finally { loading.value = false }
}
</script>

<style scoped>
.txn-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== 类型切换 ========== */
.type-bar {
  display: flex;
  position: relative;
  background: #f1f5f9;
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
}
.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.25s;
}
.type-tab.active { color: #1e293b; }
.type-icon { font-size: 16px; }

/* ========== 金额输入 ========== */
.amount-box {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 20px 24px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.amount-box.expense {
  background: linear-gradient(135deg, #fef2f2, #fff5f5);
  border: 2px solid #fecaca;
}
.amount-box.income {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  border: 2px solid #a7f3d0;
}
.amount-box:focus-within.expense { border-color: #f87171; box-shadow: 0 0 0 4px rgba(248,113,113,0.1); }
.amount-box:focus-within.income { border-color: #34d399; box-shadow: 0 0 0 4px rgba(52,211,153,0.1); }

.amount-currency {
  font-size: 28px;
  font-weight: 800;
  color: #64748b;
}
.amount-field {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 40px;
  font-weight: 800;
  color: #1e293b;
  outline: none;
  min-width: 0;
  line-height: 1.2;
}
.amount-box.expense .amount-field { color: #ef4444; }
.amount-box.income .amount-field { color: #10b981; }
.amount-field::placeholder { color: #d1d5db; font-weight: 600; }
.amount-field::-webkit-outer-spin-button,
.amount-field::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.amount-field { -moz-appearance: textfield; }

/* 语音按钮 */
.voice-btn {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid #e2e8f0; background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; color: #94a3b8;
  transition: all 0.25s;
}
.voice-btn:hover { border-color: #667eea; color: #667eea; }
.voice-btn.listening {
  border-color: #ef4444; color: #ef4444;
  background: #fef2f2; animation: pulse-ring 1.2s infinite;
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
  70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}

.voice-hint {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 10px;
  background: #fef2f2; color: #ef4444; font-size: 13px;
}
.voice-pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
  animation: pulse-dot 1s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.voice-result {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; border-radius: 10px;
  background: #f0fdf4; color: #16a34a; font-size: 13px;
}
.voice-result-close {
  border: none; background: none; cursor: pointer;
  color: #94a3b8; font-size: 14px; padding: 2px;
}

/* ========== 分类选择 ========== */
.cat-select-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ========== 详情区域 ========== */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 14px;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  min-width: 60px;
}

/* ========== 提交按钮 ========== */
.submit-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.submit-btn.expense {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}
.submit-btn.income {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}
.submit-btn:hover {
  transform: translateY(-2px);
}
.submit-btn:active {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .txn-form {
    gap: 14px;
  }
  .type-tab {
    padding: 12px;
    font-size: 15px;
    min-height: 48px;
  }
  .amount-box {
    padding: 16px 18px;
  }
  .amount-currency {
    font-size: 24px;
  }
  .amount-field {
    font-size: 32px;
  }
  .detail-section {
    padding: 12px;
    gap: 8px;
  }
  .detail-row {
    min-height: 44px;
  }
  .submit-btn {
    height: 52px;
    font-size: 17px;
    border-radius: 14px;
  }
}
</style>

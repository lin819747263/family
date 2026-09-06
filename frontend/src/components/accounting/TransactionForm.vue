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

    <!-- 分类选择 -->
    <div class="cat-select-row">
      <span class="d-label">📂 分类</span>
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
      <!-- 日期 -->
      <div class="detail-row">
        <span class="d-label">📅 日期</span>
        <el-popover placement="bottom-start" :width="280" trigger="click">
          <template #reference>
            <button class="d-chip">{{ dateDisplayText }} ▾</button>
          </template>
          <el-date-picker
            v-model="form.transactionDate"
            type="date"
            value-format="YYYY-MM-DD"
            :clearable="false"
            style="width:100%;"
          />
        </el-popover>
      </div>

      <!-- 备注 -->
      <div class="detail-row">
        <span class="d-label">✏️ 备注</span>
        <input v-model="form.note" class="d-field" placeholder="添加备注..." />
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
const amountInput = ref(null)

const isEdit = computed(() => !!props.editData)

const form = reactive({
  bookId: null, type: 'expense', amount: '', categoryId: '', transactionDate: dayjs().format('YYYY-MM-DD'), note: '', tags: ''
})

// 分类树（保留用于语音匹配）
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

// 用于 chip 展示的扁平分类列表（一级分类优先，无子分类时直接显示）
const displayCategories = computed(() => {
  const filtered = allCategories.value.filter(c => c.type === form.type)
  const parents = filtered.filter(c => !c.parentId)
  const result = []
  parents.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  for (const p of parents) {
    const children = filtered.filter(c => c.parentId === p.id)
    if (children.length === 0) {
      result.push(p)
    } else {
      // 有子分类时，只显示一级分类（chip 简洁）
      result.push(p)
    }
  }
  return result
})

// 日期显示文本
const dateDisplayText = computed(() => {
  if (!form.transactionDate) return '选择日期'
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  if (form.transactionDate === today) return '今天 · ' + dayjs().format('M月D日')
  if (form.transactionDate === yesterday) return '昨天 · ' + dayjs(form.transactionDate).format('M月D日')
  return dayjs(form.transactionDate).format('M月D日')
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
    const catRes = await accountingApi.getCategories({ familyId: authStore.currentFamily?.id })
    allCategories.value = catRes.data
    // 始终使用全局账本
    if (!isEdit.value) form.bookId = accountingStore.currentBookId || null
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
      if (!form.bookId) { ElMessage.warning('请先选择账本'); return }
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
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ========== 类型切换（滑动指示） ========== */
.type-bar {
  position: relative; display: grid; grid-template-columns: 1fr 1fr;
  background: var(--cream, #F3EADD); border-radius: 13px; padding: 4px;
}
.type-tab {
  position: relative; z-index: 2; padding: 10px; border-radius: 10px;
  border: none; background: transparent; color: var(--text-soft, #A08D7A);
  font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: color 0.3s;
}
.type-tab.active { color: #fff; }
.type-icon { font-size: 16px; }
.type-indicator {
  position: absolute; z-index: 1; top: 4px; bottom: 4px; left: 4px;
  width: calc(50% - 4px); border-radius: 10px;
  background: linear-gradient(135deg, var(--rose, #D99A9A), #B06A6A);
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.5, 1), background 0.35s;
  box-shadow: 0 4px 12px rgba(176, 106, 106, 0.3);
}
.type-indicator.income {
  transform: translateX(100%);
  background: linear-gradient(135deg, var(--sage, #A8B08A), #7E8862);
  box-shadow: 0 4px 12px rgba(126, 136, 98, 0.3);
}

/* ========== 金额输入 ========== */
.amount-box {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 4px 12px;
  border-bottom: 2px solid var(--wood-light, #E2CDB2);
  transition: border-color 0.3s;
}
.amount-box:focus-within { border-color: var(--terracotta, #C89F85); }
.amount-currency {
  font-size: 24px; font-weight: 800; color: var(--terra-deep, #96684A);
}
.amount-field {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 34px; font-weight: 800; color: var(--text-deep, #6B5744);
  letter-spacing: -0.02em; min-width: 0;
}
.amount-field::placeholder { color: var(--wood-light, #E2CDB2); }
.amount-field::-webkit-outer-spin-button,
.amount-field::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.amount-field { -moz-appearance: textfield; }

/* 语音按钮 */
.voice-btn {
  width: 40px; height: 40px; border-radius: 12px; border: none;
  background: var(--cream, #F3EADD); color: var(--terra-deep, #96684A);
  cursor: pointer; font-size: 17px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s; flex-shrink: 0;
}
.voice-btn:hover { background: var(--apricot, #EDE0CE); }
.voice-btn.listening {
  background: var(--rose, #D99A9A); color: #fff;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }

.voice-hint {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--rose-d, #B06A6A); margin: 6px 0 2px;
}
.voice-pulse {
  width: 8px; height: 8px; border-radius: 50%; background: var(--rose, #D99A9A);
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.voice-result {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 10px;
  background: rgba(168, 176, 138, 0.16); color: var(--sage-d, #7E8862);
  font-size: 12.5px;
}
.voice-result-close {
  border: none; background: none; cursor: pointer;
  color: var(--text-soft, #A08D7A); font-size: 14px; padding: 2px; margin-left: auto;
}

/* ========== 分类选择 ========== */
.cat-select-row {
  display: flex; align-items: center; gap: 10px;
}
.cat-select-row :deep(.el-select) {
  --el-select-border-color-hover: var(--terracotta, #C89F85);
}

/* ========== 详情区域 ========== */
.detail-section { display: flex; flex-direction: column; gap: 10px; }
.detail-row { display: flex; align-items: center; gap: 10px; }
.d-label {
  font-size: 13px; color: var(--text-soft, #A08D7A);
  white-space: nowrap; flex-shrink: 0;
}
.d-chip {
  flex: 1; text-align: left; padding: 9px 13px;
  border-radius: 11px; background: var(--cream, #F3EADD);
  font-size: 13px; font-weight: 600; color: var(--terra-deep, #96684A);
  cursor: pointer; border: none; transition: all 0.25s;
}
.d-chip:hover { background: var(--apricot, #EDE0CE); }
.d-field {
  flex: 1; padding: 9px 12px; border-radius: 11px;
  border: 1.5px solid var(--wood-light, #E2CDB2); background: #FFFDF9;
  font-size: 13.5px; color: var(--text-deep, #6B5744); outline: none;
  transition: all 0.25s; min-width: 0;
}
.d-field:focus {
  border-color: var(--terracotta, #C89F85);
  box-shadow: 0 0 0 3px rgba(200, 159, 133, 0.14);
}

/* ========== 提交按钮 ========== */
.submit-btn {
  width: 100%; margin-top: 4px; padding: 14px;
  border-radius: 14px; border: none; cursor: pointer;
  font-size: 15px; font-weight: 700; letter-spacing: 0.06em; color: #fff;
  transition: transform 0.3s, box-shadow 0.3s;
}
.submit-btn.expense {
  background: linear-gradient(135deg, var(--rose, #D99A9A), #B06A6A);
  box-shadow: 0 8px 20px rgba(176, 106, 106, 0.35);
}
.submit-btn.income {
  background: linear-gradient(135deg, var(--sage, #A8B08A), #7E8862);
  box-shadow: 0 8px 20px rgba(126, 136, 98, 0.35);
}
.submit-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(160, 120, 90, 0.4); }
.submit-btn:active { transform: translateY(-1px) scale(0.99); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.btn-loading {
  display: inline-block; width: 18px; height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .txn-form { padding: 14px; gap: 12px; }
  .type-tab { padding: 12px; font-size: 15px; min-height: 48px; }
  .amount-field { font-size: 30px; }
  .submit-btn { padding: 16px; font-size: 16px; }
}
</style>

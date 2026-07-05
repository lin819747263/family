<template>
  <div class="batch-form">
    <!-- 顶部：共用设置 -->
    <div class="batch-shared">
      <div class="shared-row">
        <span class="shared-label">账本</span>
        <el-select v-model="shared.bookId" placeholder="选择账本" style="flex:1;" size="default">
          <el-option v-for="b in books" :key="b.id" :label="b.name" :value="b.id">
            <span style="display:flex;align-items:center;gap:6px;">
              <el-tag :type="b.type === 'family' ? 'primary' : 'success'" size="small">{{ b.type === 'family' ? '家庭' : '个人' }}</el-tag>{{ b.name }}
            </span>
          </el-option>
        </el-select>
      </div>
      <div class="shared-row">
        <span class="shared-label">日期</span>
        <el-date-picker
          v-model="shared.date"
          type="date"
          placeholder="默认日期"
          style="flex:1;"
          value-format="YYYY-MM-DD"
          size="default"
        />
      </div>
    </div>

    <!-- 交易条目列表 -->
    <div class="batch-entries">
      <div v-for="(entry, idx) in entries" :key="idx" class="entry-card">
        <div class="entry-header">
          <span class="entry-index">#{{ idx + 1 }}</span>
          <div class="entry-type-toggle">
            <button class="mini-type-btn" :class="{ active: entry.type === 'expense', expense: entry.type === 'expense' }" @click="entry.type = 'expense'; entry.categoryId = ''">支</button>
            <button class="mini-type-btn" :class="{ active: entry.type === 'income', income: entry.type === 'income' }" @click="entry.type = 'income'; entry.categoryId = ''">收</button>
          </div>
          <button v-if="entries.length > 1" class="entry-remove" @click="removeEntry(idx)" title="删除此条">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>

        <div class="entry-body">
          <!-- 金额 -->
          <div class="entry-amount-row">
            <span class="entry-currency">¥</span>
            <input
              v-model="entry.amount"
              type="text"
              step="0.01"
              placeholder="0.00"
              class="entry-amount-input"
              inputmode="decimal"
              @input="onAmountInput($event, entry)"
            />
          </div>

          <!-- 分类 + 备注 -->
          <div class="entry-fields">
            <el-select
              v-model="entry.categoryId"
              placeholder="选择分类"
              filterable
              size="small"
              style="flex:1;"
            >
              <template v-for="group in getCategoryTree(entry.type)" :key="group.id">
                <el-option-group v-if="group.children?.length" :label="group.name">
                  <el-option
                    v-for="child in group.children"
                    :key="child.id"
                    :label="`${group.name} / ${child.name}`"
                    :value="child.id"
                  >
                    <span style="display:flex;align-items:center;gap:4px;font-size:13px;">
                      <span style="color:#94a3b8;">{{ group.name }}</span>
                      <span>{{ child.name }}</span>
                    </span>
                  </el-option>
                </el-option-group>
                <el-option v-else :key="group.id" :label="group.name" :value="group.id" />
              </template>
            </el-select>
            <el-input
              v-model="entry.note"
              placeholder="备注"
              size="small"
              style="width:120px;"
              clearable
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <button class="add-entry-btn" @click="addEntry">
      <el-icon><Plus /></el-icon> 添加一条
    </button>

    <!-- 底部操作 -->
    <div class="batch-footer">
      <div class="batch-summary">
        共 <strong>{{ entries.length }}</strong> 笔，
        合计 <strong class="summary-amount">¥{{ totalAmount }}</strong>
      </div>
      <el-button
        type="primary"
        :loading="loading"
        class="submit-btn"
        @click="handleSubmit"
      >
        批量记账
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { accountingApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { useAccountingStore } from '@/store/accounting'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const emit = defineEmits(['success'])
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const loading = ref(false)
const allCategories = ref([])
const books = ref([])

const shared = reactive({
  bookId: null,
  date: dayjs().format('YYYY-MM-DD')
})

function createEmptyEntry() {
  return { type: 'expense', amount: '', categoryId: '', note: '' }
}

const entries = ref([createEmptyEntry(), createEmptyEntry(), createEmptyEntry()])

const categoryMap = computed(() => {
  const map = {}
  allCategories.value.forEach(c => {
    if (!map[c.type]) map[c.type] = []
    map[c.type].push(c)
  })
  return map
})

function getCategoryTree(type) {
  const filtered = categoryMap.value[type] || []
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
}

const totalAmount = computed(() => {
  const sum = entries.value.reduce((s, e) => s + (Math.round(parseFloat(e.amount) * 100) / 100 || 0), 0)
  return sum.toFixed(2)
})

function addEntry() {
  entries.value.push(createEmptyEntry())
}

// 金额输入过滤
function onAmountInput(e, entry) {
  let val = e.target.value.replace(/[^\d.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
  if (parts[1] && parts[1].length > 2) val = parts[0] + '.' + parts[1].slice(0, 2)
  entry.amount = val
}

function removeEntry(idx) {
  entries.value.splice(idx, 1)
}

onMounted(async () => {
  try {
    const [catRes, bookRes] = await Promise.all([
      accountingApi.getCategories({ familyId: authStore.currentFamily?.id }),
      accountingApi.getBooks({ familyId: authStore.currentFamily?.id })
    ])
    allCategories.value = catRes.data
    books.value = bookRes.data
    if (accountingStore.currentBookId && bookRes.data.find(b => b.id === accountingStore.currentBookId)) {
      shared.bookId = accountingStore.currentBookId
    } else if (bookRes.data.length === 1) {
      shared.bookId = bookRes.data[0].id
    }
  } catch { /* handled by interceptor */ }
})

async function handleSubmit() {
  if (!shared.bookId) return ElMessage.warning('请选择账本')
  if (!shared.date) return ElMessage.warning('请选择日期')

  const validEntries = entries.value.filter(e => e.amount && e.categoryId)
  if (validEntries.length === 0) return ElMessage.warning('请至少填写一笔完整的记录（金额+分类）')

  const incomplete = entries.value.filter(e => (e.amount && !e.categoryId) || (!e.amount && e.categoryId))
  if (incomplete.length > 0) {
    return ElMessage.warning(`第 ${incomplete.map((_, i) => entries.value.indexOf(incomplete[i]) + 1).join(',')} 笔记录不完整，请补充金额和分类`)
  }

  loading.value = true
  let successCount = 0
  let failCount = 0

  for (const entry of validEntries) {
    try {
      await accountingApi.createTransaction({
        bookId: shared.bookId,
        type: entry.type,
        amount: Math.round(parseFloat(entry.amount) * 100) / 100,
        categoryId: entry.categoryId,
        transactionDate: shared.date,
        note: entry.note || ''
      })
      successCount++
    } catch {
      failCount++
    }
  }

  loading.value = false

  if (failCount === 0) {
    ElMessage.success(`成功记录 ${successCount} 笔`)
    entries.value = [createEmptyEntry(), createEmptyEntry(), createEmptyEntry()]
    emit('success')
  } else {
    ElMessage.warning(`成功 ${successCount} 笔，失败 ${failCount} 笔`)
    if (successCount > 0) emit('success')
  }
}
</script>

<style scoped>
.batch-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

/* 共用设置区域 */
.batch-shared {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}
.shared-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.shared-label {
  width: 36px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  flex-shrink: 0;
}

/* 交易条目 */
.batch-entries {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.entry-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  transition: border-color 0.2s;
}
.entry-card:hover {
  border-color: #cbd5e1;
}
.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.entry-index {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  min-width: 20px;
}
.entry-type-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}
.mini-type-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.mini-type-btn.active {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.mini-type-btn.active.expense { color: #f87171; }
.mini-type-btn.active.income { color: #34d399; }

.entry-remove {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.entry-remove:hover {
  background: #fef2f2;
  color: #f87171;
}

.entry-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 金额行 */
.entry-amount-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.entry-currency {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
.entry-amount-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  outline: none;
  min-width: 0;
}
.entry-amount-input::placeholder { color: #cbd5e1; }
.entry-amount-input::-webkit-outer-spin-button,
.entry-amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.entry-amount-input {
  -moz-appearance: textfield;
}

/* 分类+备注行 */
.entry-fields {
  display: flex;
  gap: 8px;
}

/* 添加按钮 */
.add-entry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.add-entry-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.04);
}

/* 底部 */
.batch-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.batch-summary {
  font-size: 14px;
  color: #64748b;
}
.summary-amount {
  color: #1e293b;
  font-size: 18px;
}

.submit-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  padding: 0 24px;
}
.submit-btn:hover { opacity: 0.9; }

/* 响应式 */
@media (max-width: 768px) {
  .entry-fields {
    flex-direction: column;
  }
  .entry-fields .el-input {
    width: 100% !important;
  }
  .entry-header {
    min-height: 44px;
  }
  .mini-type-btn {
    min-width: 40px;
    min-height: 36px;
    font-size: 14px;
  }
  .entry-amount-row .entry-currency {
    font-size: 20px;
  }
  .entry-amount-row input {
    font-size: 24px;
  }
  .submit-btn {
    height: 52px;
    font-size: 17px;
  }
}
</style>

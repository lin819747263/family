<template>
  <div class="batch-form">
    <!-- 顶部：共用设置 -->
    <div class="batch-shared">
      <div class="shared-row">
        <span class="d-label">📅 日期</span>
        <el-popover placement="bottom-start" :width="280" trigger="click">
          <template #reference>
            <button class="d-chip">{{ dateDisplayText }} ▾</button>
          </template>
          <el-date-picker
            v-model="shared.date"
            type="date"
            value-format="YYYY-MM-DD"
            :clearable="false"
            style="width:100%;"
          />
        </el-popover>
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
              placeholder="📂 选择分类"
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
            <input
              v-model="entry.note"
              class="d-field-sm"
              placeholder="✏️ 备注"
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

// 日期显示文本
const dateDisplayText = computed(() => {
  if (!shared.date) return '选择日期'
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  if (shared.date === today) return '今天 · ' + dayjs().format('M月D日')
  if (shared.date === yesterday) return '昨天 · ' + dayjs(shared.date).format('M月D日')
  return dayjs(shared.date).format('M月D日')
})

const emit = defineEmits(['success'])
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const loading = ref(false)
const allCategories = ref([])

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
    const catRes = await accountingApi.getCategories({ familyId: authStore.currentFamily?.id })
    allCategories.value = catRes.data
    // 始终使用全局账本
    shared.bookId = accountingStore.currentBookId || null
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
  display: flex; flex-direction: column; gap: 14px;
  max-height: 65vh; overflow-y: auto; padding: 16px 18px 18px;
}
.batch-form::-webkit-scrollbar { width: 6px; }
.batch-form::-webkit-scrollbar-thumb { background: var(--wood-light, #E2CDB2); border-radius: 3px; }

/* 共用设置区域 */
.batch-shared {
  display: flex; gap: 8px; margin-bottom: 4px;
}
.shared-row {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
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

/* 交易条目 */
.batch-entries { display: flex; flex-direction: column; gap: 12px; }
.entry-card {
  border: 1.5px solid rgba(226, 205, 178, 0.7);
  border-radius: 16px; padding: 12px;
  background: rgba(243, 234, 221, 0.35);
  transition: border-color 0.25s;
}
.entry-card:hover { border-color: var(--wood-light, #E2CDB2); }
.entry-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.entry-index { font-size: 12px; font-weight: 800; color: var(--text-soft, #A08D7A); }
.entry-type-toggle {
  display: flex; background: var(--cream, #F3EADD); border-radius: 8px; padding: 2px; margin-left: auto;
}
.mini-type-btn {
  padding: 4px 11px; border-radius: 6px; border: none;
  background: transparent; font-size: 12px; font-weight: 700;
  color: var(--text-soft, #A08D7A); cursor: pointer; transition: all 0.25s;
}
.mini-type-btn.active.expense { background: var(--rose, #D99A9A); color: #fff; }
.mini-type-btn.active.income { background: var(--sage, #A8B08A); color: #fff; }

.entry-remove {
  margin-left: 8px; width: 24px; height: 24px; border-radius: 7px;
  border: none; background: transparent; color: var(--text-soft, #A08D7A);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.entry-remove:hover { background: rgba(217, 154, 154, 0.25); color: var(--rose-d, #B06A6A); }

.entry-body { display: flex; flex-direction: column; gap: 8px; }

/* 金额行 */
.entry-amount-row {
  display: flex; align-items: center; gap: 6px;
  border-bottom: 1.5px solid var(--wood-light, #E2CDB2); padding-bottom: 6px;
}
.entry-currency { font-size: 16px; font-weight: 800; color: var(--terra-deep, #96684A); }
.entry-amount-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 20px; font-weight: 700; color: var(--text-deep, #6B5744); min-width: 0;
}
.entry-amount-input::placeholder { color: var(--wood-light, #E2CDB2); }
.entry-amount-input::-webkit-outer-spin-button,
.entry-amount-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.entry-amount-input { -moz-appearance: textfield; }

/* 分类+备注行 */
.entry-fields { display: flex; gap: 8px; }
.entry-fields :deep(.el-input__wrapper),
.entry-fields :deep(.el-select) {
  border-radius: 11px;
}
.d-field-sm {
  width: 120px; padding: 8px 10px; border-radius: 11px;
  border: 1.5px solid var(--wood-light, #E2CDB2); background: #FFFDF9;
  font-size: 12.5px; color: var(--text-deep, #6B5744); outline: none;
  transition: all 0.25s;
}
.d-field-sm:focus {
  border-color: var(--terracotta, #C89F85);
  box-shadow: 0 0 0 3px rgba(200, 159, 133, 0.14);
}

/* 添加按钮 */
.add-entry-btn {
  width: 100%; margin-top: 4px; padding: 11px;
  border-radius: 12px; border: 2px dashed var(--wood-light, #E2CDB2);
  background: transparent; color: var(--text-soft, #A08D7A);
  font-size: 13.5px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.25s;
}
.add-entry-btn:hover {
  border-color: var(--terracotta, #C89F85); color: var(--terra-deep, #96684A);
  background: rgba(243, 234, 221, 0.6);
}

/* 底部 */
.batch-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; border-radius: 12px;
  background: var(--cream, #F3EADD); font-size: 13.5px; color: var(--text-soft, #A08D7A);
}
.batch-summary { }
.summary-amount { font-size: 17px; color: var(--terra-deep, #96684A); font-weight: 700; }

.submit-btn {
  width: 100%; margin-top: 14px; padding: 14px;
  border-radius: 14px; border: none; cursor: pointer;
  font-size: 15px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, var(--sage, #A8B08A), #7E8862);
  box-shadow: 0 8px 20px rgba(126, 136, 98, 0.35);
  transition: transform 0.3s, box-shadow 0.3s;
}
.submit-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(160, 120, 90, 0.4); }

/* 响应式 */
@media (max-width: 768px) {
  .batch-form { padding: 14px; }
  .batch-shared { flex-direction: column; }
  .entry-fields { flex-direction: column; }
  .entry-fields .el-input { width: 100% !important; }
  .submit-btn { padding: 16px; font-size: 16px; }
}
</style>

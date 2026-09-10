<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    :width="560"
    top="12vh"
    destroy-on-close
    class="global-search-dialog warm-dialog"
    @closed="$emit('close')"
  >
    <!-- 搜索输入框 -->
    <div class="search-input-wrap">
      <div class="search-icon">
        <el-icon :size="20"><Search /></el-icon>
      </div>
      <input
        ref="inputRef"
        v-model="keyword"
        class="search-input"
        placeholder="搜索账单、物品、待办、菜谱..."
        @input="handleSearch"
        @keydown.esc="visible = false"
        @keydown.up.prevent="navigate(-1)"
        @keydown.down.prevent="navigate(1)"
        @keydown.enter.prevent="goToSelected"
      />
      <div class="search-shortcut">
        <kbd>ESC</kbd>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" ref="resultsRef">
      <!-- 空状态 -->
      <div v-if="!keyword.trim()" class="search-empty">
        <div class="search-empty-icon">🔍</div>
        <p>输入关键词开始搜索</p>
        <div class="search-tips">
          <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>

      <!-- 搜索中 -->
      <div v-else-if="searching" class="search-loading">
        <el-icon class="is-loading" :size="20"><Loading /></el-icon>
        <span>搜索中...</span>
      </div>

      <!-- 无结果 -->
      <div v-else-if="!hasResults" class="search-empty">
        <div class="search-empty-icon">😅</div>
        <p>没有找到「{{ keyword }}」相关内容</p>
      </div>

      <!-- 结果列表 -->
      <template v-else>
        <div v-for="(group, gi) in filteredGroups" :key="gi" class="result-group">
          <div class="group-label">
            <span class="group-icon">{{ group.icon }}</span>
            <span>{{ group.label }}</span>
            <span class="group-count">{{ group.items.length }}</span>
          </div>
          <div
            v-for="(item, ii) in group.items"
            :key="item.id"
            class="result-item"
            :class="{ active: activeIndex === getGlobalIndex(gi, ii) }"
            @click="goTo(item)"
            @mouseenter="activeIndex = getGlobalIndex(gi, ii)"
          >
            <div class="result-icon" :style="{ background: group.color }">
              <span>{{ group.icon }}</span>
            </div>
            <div class="result-info">
              <div class="result-title" v-html="highlight(item.title)"></div>
              <div class="result-desc" v-if="item.desc" v-html="highlight(item.desc)"></div>
            </div>
            <div class="result-meta" v-if="item.meta">{{ item.meta }}</div>
            <el-icon class="result-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部 -->
    <div class="search-footer">
      <span>由家庭管家提供搜索</span>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { accountingApi, inventoryApi, todoApi, recipeApi, anniversaryApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore()
const accountingStore = useAccountingStore()

const inputRef = ref(null)
const resultsRef = ref(null)
const keyword = ref('')
const searching = ref(false)
const activeIndex = ref(0)
const searchResults = ref([])

let searchTimer = null

// 搜索分组
const resultGroups = computed(() => {
  const groups = []
  const items = searchResults.value

  const txns = items.filter(i => i._type === 'transaction')
  const todos = items.filter(i => i._type === 'todo')
  const inventory = items.filter(i => i._type === 'inventory')
  const recipes = items.filter(i => i._type === 'recipe')
  const anniversaries = items.filter(i => i._type === 'anniversary')

  if (txns.length) groups.push({ label: '记账', icon: '💰', color: 'linear-gradient(135deg, var(--terracotta), var(--terracotta-d))', items: txns })
  if (todos.length) groups.push({ label: '待办', icon: '📋', color: 'linear-gradient(135deg, var(--amber), var(--amber-d))', items: todos })
  if (inventory.length) groups.push({ label: '物品', icon: '📦', color: 'linear-gradient(135deg, var(--sage), var(--sage-d))', items: inventory })
  if (recipes.length) groups.push({ label: '菜谱', icon: '🍳', color: 'linear-gradient(135deg, var(--rose), var(--rose-d))', items: recipes })
  if (anniversaries.length) groups.push({ label: '纪念日', icon: '📅', color: 'linear-gradient(135deg, var(--plum), var(--sky))', items: anniversaries })

  return groups
})

const filteredGroups = computed(() => resultGroups.value)
const hasResults = computed(() => searchResults.value.length > 0)

function getGlobalIndex(groupIdx, itemIdx) {
  let idx = 0
  for (let i = 0; i < groupIdx; i++) {
    idx += filteredGroups.value[i].items.length
  }
  return idx + itemIdx
}

// 高亮关键词（先转义 HTML 再插入 mark 标签）
function highlight(text) {
  if (!keyword.value.trim() || !text) return text
  // 先转义 HTML 实体
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const escaped = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

// 搜索
function handleSearch() {
  clearTimeout(searchTimer)
  activeIndex.value = 0
  if (!keyword.value.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(doSearch, 300)
}

async function doSearch() {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return

  searching.value = true
  const familyId = authStore.currentFamily?.id
  const results = []

  try {
    // 并行搜索各模块
    const promises = []

    // 搜索账单
    if (accountingStore.currentBookId) {
      promises.push(
        accountingApi.getTransactions({
          bookId: accountingStore.currentBookId,
          startDate: dayjs().subtract(1, 'year').format('YYYY-MM-01'),
          endDate: dayjs().format('YYYY-MM-DD'),
          search: q,
          pageSize: 5
        }).then(res => {
          (res.data?.list || []).forEach(t => {
            results.push({
              _type: 'transaction',
              id: t.id,
              title: t.note || (t.type === 'income' ? '收入' : '支出'),
              desc: `${t.type === 'income' ? '+' : '-'}¥${parseFloat(t.amount).toFixed(2)} · ${t.Category?.name || ''}`,
              meta: t.transactionDate,
              path: '/accounting',
              query: { month: t.transactionDate?.slice(0, 7) }
            })
          })
        }).catch(() => {})
      )
    }

    // 搜索待办
    if (familyId) {
      promises.push(
        todoApi.getList({ familyId, search: q, pageSize: 5 }).then(res => {
          (res.data?.list || []).forEach(t => {
            results.push({
              _type: 'todo',
              id: t.id,
              title: t.title,
              desc: t.description || '',
              meta: t.dueDate ? `截止 ${t.dueDate}` : '',
              path: '/reminder/todo'
            })
          })
        }).catch(() => {})
      )

      // 搜索物品
      promises.push(
        inventoryApi.getItems({ search: q, pageSize: 5 }).then(res => {
          (res.data?.list || []).forEach(i => {
            results.push({
              _type: 'inventory',
              id: i.id,
              title: i.name,
              desc: `${i.category || '未分类'} · ${i.Space?.name || ''}`,
              meta: i.price ? `¥${parseFloat(i.price).toFixed(2)}` : '',
              path: '/inventory'
            })
          })
        }).catch(() => {})
      )

      // 搜索菜谱
      promises.push(
        recipeApi.getList({ familyId, keyword: q, pageSize: 5 }).then(res => {
          (res.data?.list || []).forEach(r => {
            results.push({
              _type: 'recipe',
              id: r.id,
              title: r.name,
              desc: r.description || '',
              meta: r.difficulty ? { easy: '简单', medium: '中等', hard: '困难' }[r.difficulty] : '',
              path: '/recipe'
            })
          })
        }).catch(() => {})
      )

      // 搜索纪念日
      promises.push(
        anniversaryApi.getList({ familyId, search: q }).then(res => {
          (res.data || []).slice(0, 3).forEach(a => {
            results.push({
              _type: 'anniversary',
              id: a.id,
              title: a.title,
              desc: a.note || '',
              meta: a.date,
              path: '/reminder/anniversary'
            })
          })
        }).catch(() => {})
      )
    }

    await Promise.all(promises)
  } catch (e) {
    console.error(e)
  } finally {
    searchResults.value = results
    searching.value = false
  }
}

// 键盘导航
function navigate(delta) {
  const total = searchResults.value.length
  if (!total) return
  activeIndex.value = (activeIndex.value + delta + total) % total
  scrollToActive()
}

function scrollToActive() {
  nextTick(() => {
    const el = resultsRef.value?.querySelector('.result-item.active')
    if (el) el.scrollIntoView({ block: 'nearest' })
  })
}

function goToSelected() {
  const items = searchResults.value
  if (!items.length) return
  const item = items[activeIndex.value]
  if (item) goTo(item)
}

function goTo(item) {
  if (item.path) {
    router.push({ path: item.path, query: item.query || {} })
  }
  visible.value = false
}

// 全局快捷键
function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    visible.value = !visible.value
  }
}

const visible = computed({
  get: () => props.visible,
  set: (val) => { if (!val) emit('close') }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(searchTimer)
})

watch(() => props.visible, (val) => {
  if (val) {
    keyword.value = ''
    searchResults.value = []
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})
</script>

<style scoped>
/* 搜索对话框 */
.global-search-dialog.el-dialog {
  padding: 0;
}
.global-search-dialog.el-dialog .el-dialog__header {
  display: none;
}
.global-search-dialog.el-dialog .el-dialog__body {
  padding: 0;
}

/* 搜索输入框 */
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #F3EADD;
}
.search-icon {
  color: #A08D7A;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #6B5744;
  background: transparent;
  line-height: 1.5;
}
.search-input::placeholder {
  color: #A08D7A;
}
.search-shortcut {
  flex-shrink: 0;
}
.search-shortcut kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-family: inherit;
  color: #A08D7A;
  background: #F3EADD;
  border: 1px solid rgba(226,205,178,.7);
  border-radius: 4px;
}

/* 搜索结果 */
.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.search-empty {
  text-align: center;
  padding: 32px 20px;
  color: #A08D7A;
}
.search-empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}
.search-empty p {
  margin: 0;
  font-size: 14px;
}
.search-tips {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 12px;
  color: #E2CDB2;
}
.search-tips kbd {
  display: inline-block;
  padding: 1px 5px;
  font-size: 11px;
  font-family: inherit;
  background: #F3EADD;
  border: 1px solid rgba(226,205,178,.7);
  border-radius: 3px;
  margin-right: 4px;
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: #A08D7A;
  font-size: 14px;
}

/* 结果分组 */
.result-group {
  margin-bottom: 4px;
}
.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #A08D7A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.group-icon {
  font-size: 14px;
}
.group-count {
  font-size: 11px;
  background: #F3EADD;
  padding: 1px 6px;
  border-radius: 10px;
  color: #A08D7A;
}

/* 结果项 */
.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.result-item:hover,
.result-item.active {
  background: #F3EADD;
}
.result-item.active {
  background: rgba(200, 159, 133, 0.08);
}
.result-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.result-info {
  flex: 1;
  min-width: 0;
}
.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #6B5744;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.result-title :deep(mark) {
  background: rgba(200, 159, 133, 0.15);
  color: var(--terra-deep);
  padding: 0 2px;
  border-radius: 2px;
}
.result-desc {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.result-desc :deep(mark) {
  background: rgba(200, 159, 133, 0.1);
  color: var(--terra-deep);
  padding: 0 2px;
  border-radius: 2px;
}
.result-meta {
  font-size: 12px;
  color: #E2CDB2;
  flex-shrink: 0;
}
.result-arrow {
  color: #E2CDB2;
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.result-item:hover .result-arrow,
.result-item.active .result-arrow {
  opacity: 1;
}

/* 底部 */
.search-footer {
  display: flex;
  justify-content: center;
  padding: 10px;
  border-top: 1px solid #F3EADD;
  font-size: 11px;
  color: #E2CDB2;
}
</style>

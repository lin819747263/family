<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">物品总览</div>
      <div style="display:flex;gap:8px;">
        <el-input v-model="search" placeholder="搜索物品" :prefix-icon="Search" style="width:160px;" @keyup.enter="loadItems" clearable @clear="loadItems" />
        <el-tree-select
          v-model="filterSpaceId"
          :data="spaceTree"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="按位置筛选"
          style="width:160px;"
          clearable
          check-strictly
          @change="loadItems"
        />
        <el-input v-model="filterCategory" placeholder="按分类筛选" style="width:140px;" clearable @clear="loadItems" @keyup.enter="loadItems" />
        <el-button type="primary" @click="openAddForm"><el-icon><Plus /></el-icon>添加物品</el-button>
        <el-button @click="showAiDialog = true"><el-icon><MagicStick /></el-icon>AI录入</el-button>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom:20px;">
      <el-col :xs="12" :sm="8" style="margin-bottom:12px;"><div class="card stat-card"><div class="stat-value" style="color:#409EFF;">{{ stats.total }}</div><div class="stat-label">物品总数</div></div></el-col>
      <el-col :xs="12" :sm="8" style="margin-bottom:12px;"><div class="card stat-card"><div class="stat-value" style="color:#E6A23C;">{{ stats.expiring }}</div><div class="stat-label">临期物品</div></div></el-col>
      <el-col :xs="12" :sm="8" style="margin-bottom:12px;"><div class="card stat-card"><div class="stat-value" style="color:#F56C6C;">{{ stats.borrowed }}</div><div class="stat-label">借出中</div></div></el-col>
    </el-row>

    <!-- 临期提醒 -->
    <div v-if="reminders.length > 0" class="card" style="margin-bottom:16px;padding:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <el-icon color="#E6A23C"><WarningFilled /></el-icon>
        <span style="font-weight:600;font-size:14px;">临期提醒</span>
      </div>
      <div v-for="r in reminders.slice(0, 5)" :key="r.item?.id || r.title" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:13px;">{{ r.title }}</span>
        <el-tag :type="r.urgent ? 'danger' : 'warning'" size="small">{{ r.date }}</el-tag>
      </div>
    </div>

    <div class="card" style="padding:0;">
      <div v-if="loading" style="text-align:center;padding:40px;">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <template v-else>
        <div v-if="items.length === 0" style="text-align:center;padding:60px 20px;">
          <el-icon :size="48" color="#cbd5e1"><Box /></el-icon>
          <p style="margin-top:12px;color:#94a3b8;">暂无物品，点击右上角添加</p>
        </div>
        <div v-else class="table-wrap">
        <el-table :data="items" stripe>
          <el-table-column prop="name" label="物品名称" min-width="120" />
          <el-table-column label="分类" width="100">
            <template #default="{ row }"><el-tag size="small">{{ row.category || '未分类' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="数量" width="60" align="center">
            <template #default="{ row }">{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="价格" width="100">
            <template #default="{ row }">{{ row.price ? `¥${parseFloat(row.price).toFixed(2)}` : '-' }}</template>
          </el-table-column>
          <el-table-column label="位置" min-width="120">
            <template #default="{ row }">{{ row.Space?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="过期时间" width="110">
            <template #default="{ row }">
              <span v-if="row.expiryDate" :style="{ color: isExpiring(row.expiryDate) ? '#F56C6C' : '#666' }">{{ row.expiryDate }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ { active: '在用', discarded: '已丢弃', donated: '已捐赠', sold: '已售出' }[row.status] }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click.stop="editItem(row)">编辑</el-button>
              <el-popconfirm title="确定删除此物品？" @confirm.stop="handleDelete(row.id)">
                <template #reference>
                  <el-button text type="danger" size="small" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        </div>
      </template>
      <div v-if="total > pageSize" style="text-align:center;padding:12px;">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="loadItems" />
      </div>
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑物品' : '添加物品'" width="520px" top="8vh">
      <el-form :model="itemForm" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="物品名称"><el-input v-model="itemForm.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="数量"><el-input-number v-model="itemForm.quantity" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="分类"><el-input v-model="itemForm.category" placeholder="如：电子产品" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="价格"><el-input v-model="itemForm.price" type="number" step="0.01"><template #append>¥</template></el-input></el-form-item></el-col>
        </el-row>
        <el-form-item label="存放位置">
          <el-tree-select ref="spaceTreeRef" v-model="itemForm.spaceId" :data="spaceTreeWithRecent" :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="搜索或选择位置" style="width:100%" check-strictly filterable :default-expanded-keys="defaultExpandedKeys" :render-after-expand="false" @visible-change="onDropdownVisibleChange" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="购买日期"><el-date-picker v-model="itemForm.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保修期(月)"><el-input-number v-model="itemForm.warrantyMonths" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="生产日期"><el-date-picker v-model="itemForm.productionDate" type="date" value-format="YYYY-MM-DD" style="width:100%" clearable /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保质期(月)">
            <el-select v-model="itemForm.shelfLife" placeholder="请选择" style="width:100%" clearable @change="onShelfLifeChange">
              <el-option v-for="m in shelfLifeOptions" :key="m" :label="m + '个月'" :value="m" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="过期日期">
          <el-date-picker v-model="itemForm.expiryDate" type="date" value-format="YYYY-MM-DD" style="width:100%" clearable :disabled="!!(itemForm.productionDate && itemForm.shelfLife)" />
          <div v-if="itemForm.productionDate && itemForm.shelfLife" style="font-size:12px;color:#909399;margin-top:4px;">根据生产日期和保质期自动推算</div>
        </el-form-item>
        <el-form-item label="标签"><el-input v-model="itemForm.tags" placeholder="用逗号分隔" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="itemForm.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ editing ? '更新' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- AI 录入弹窗 -->
    <el-dialog v-model="showAiDialog" title="AI 智能录入" width="480px" top="20vh">
      <div style="margin-bottom:16px;">
        <div style="font-size:14px;color:#606266;margin-bottom:12px;">
          输入物品名称和过期时间，AI自动识别。
        </div>
        <div style="font-size:12px;color:#909399;margin-bottom:8px;">示例：</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          <el-tag v-for="ex in aiExamples" :key="ex" type="info" style="cursor:pointer;" @click="aiInput = ex">{{ ex }}</el-tag>
        </div>
        <el-input
          v-model="aiInput"
          placeholder="例如：牛奶 保质期6个月"
          clearable
        />
      </div>
      <div v-if="aiResult" style="background:#f5f7fa;padding:12px;border-radius:8px;margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:8px;color:#303133;">识别结果：</div>
        <div style="display:flex;gap:24px;">
          <div><span style="color:#909399;">物品名称：</span>{{ aiResult.name }}</div>
          <div><span style="color:#909399;">过期时间：</span>{{ aiResult.expiryDate || '未设置' }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAiDialog = false">取消</el-button>
        <el-button v-if="aiResult" type="success" @click="applyAiResult">应用并添加</el-button>
        <el-button type="primary" :loading="aiLoading" @click="aiRecognize">{{ aiResult ? '重新识别' : '开始识别' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { inventoryApi, dashboardApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { Search, MagicStick } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const items = ref([])
const spaceTree = ref([])
const reminders = ref([])

// 最近选择的位置
const RECENT_KEY = 'inventory_recent_spaces'
function getRecentSpaceIds() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecentSpace(spaceId) {
  if (!spaceId) return
  const ids = getRecentSpaceIds().filter(id => id !== spaceId)
  ids.unshift(spaceId)
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 5)))
}
// 扁平化查找空间名称
function findSpaceName(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n.name
    if (n.children) { const r = findSpaceName(n.children, id); if (r) return r }
  }
  return null
}
const spaceTreeWithRecent = computed(() => {
  const recentIds = getRecentSpaceIds()
  if (!recentIds.length) return spaceTree.value
  const recentChildren = recentIds
    .map(id => ({ id, name: findSpaceName(spaceTree.value, id) }))
    .filter(n => n.name)
  if (!recentChildren.length) return spaceTree.value
  return [{ id: '__recent__', name: '⭐ 最近选择', children: recentChildren }, ...spaceTree.value]
})
const spaceTreeRef = ref(null)
const defaultExpandedKeys = computed(() => {
  return spaceTreeWithRecent.value.some(n => n.id === '__recent__') ? ['__recent__'] : []
})
// 下拉框展开时，强制设置树的展开节点
function onDropdownVisibleChange(visible) {
  if (visible) {
    nextTick(() => {
      const treeRef = spaceTreeRef.value?.treeRef
      if (treeRef && defaultExpandedKeys.value.length) {
        treeRef.setExpandedKeys(defaultExpandedKeys.value)
      }
    })
  }
}
const search = ref('')
const filterSpaceId = ref(null)
const filterCategory = ref('')
const page = ref(1), pageSize = ref(20), total = ref(0)
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const loading = ref(false)
const stats = reactive({ total: 0, expiring: 0, borrowed: 0 })

const shelfLifeOptions = [1, 2, 3, 6, 8, 12, 18, 24, 36]
const defaultForm = { name: '', quantity: 1, price: 9.9, category: '', spaceId: null, purchaseDate: dayjs().format('YYYY-MM-DD'), warrantyMonths: 0, productionDate: '', shelfLife: null, expiryDate: '', tags: '', description: '', lastUsedDate: dayjs().format('YYYY-MM-DD') }
const itemForm = reactive({ ...defaultForm })

function isExpiring(date) { return date && dayjs(date).diff(dayjs(), 'day') <= 7 && dayjs(date).diff(dayjs(), 'day') >= 0 }

// 保质期变化时自动推算过期时间
function onShelfLifeChange() {
  if (itemForm.productionDate && itemForm.shelfLife) {
    itemForm.expiryDate = dayjs(itemForm.productionDate).add(itemForm.shelfLife, 'month').format('YYYY-MM-DD')
  }
}
// 监听生产日期变化
watch(() => itemForm.productionDate, () => {
  if (itemForm.productionDate && itemForm.shelfLife) {
    itemForm.expiryDate = dayjs(itemForm.productionDate).add(itemForm.shelfLife, 'month').format('YYYY-MM-DD')
  }
})

// AI 录入相关
const showAiDialog = ref(false)
const aiInput = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const aiExamples = [
  '牛奶 保质期6个月',
  '面包 明天过期',
  '酸奶 2025-12-31过期',
  '方便面 保质期12个月'
]

// AI 识别物品
async function aiRecognize() {
  if (!aiInput.value.trim()) return ElMessage.warning('请输入物品信息')
  aiLoading.value = true
  aiResult.value = null
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `请帮我创建一个物品记录，物品信息：${aiInput.value}` }],
        familyId: authStore.currentFamily?.id
      })
    })
    const data = await res.json()
    if (data.code === 0 && data.data?.toolCall?.result?.item) {
      aiResult.value = data.data.toolCall.result.item
    } else {
      ElMessage.error(data.message || '识别失败，请重试')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('AI 服务请求失败')
  } finally {
    aiLoading.value = false
  }
}

// 应用 AI 结果
function applyAiResult() {
  if (!aiResult.value) return
  // 重置表单
  resetForm()
  // 填充 AI 识别的结果
  Object.assign(itemForm, {
    name: aiResult.value.name || '',
    expiryDate: aiResult.value.expiryDate || ''
  })
  // 关闭 AI 弹窗，打开表单弹窗
  showAiDialog.value = false
  editing.value = false
  showForm.value = true
  // 清空 AI 输入
  aiInput.value = ''
  aiResult.value = null
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadSpaces()
  loadItems()
  loadStats()
  loadReminders()
})

async function loadSpaces() {
  const res = await inventoryApi.getSpaces({ familyId: authStore.currentFamily?.id })
  spaceTree.value = res.data
}

async function loadItems() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, familyId: authStore.currentFamily?.id }
    if (search.value) params.search = search.value
    if (filterSpaceId.value) params.spaceId = filterSpaceId.value
    if (filterCategory.value) params.category = filterCategory.value
    const res = await inventoryApi.getItems(params)
    items.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadStats() {
  try {
    const dashRes = await dashboardApi.getData({ familyId: authStore.currentFamily?.id })
    stats.total = dashRes.data.inventory?.totalItems || 0
    stats.expiring = dashRes.data.inventory?.expiringItems || 0
  } catch (e) { console.error(e) }
}

async function loadReminders() {
  try {
    const res = await inventoryApi.getReminders({ familyId: authStore.currentFamily?.id })
    reminders.value = res.data || []
  } catch (e) { console.error(e) }
}

function resetForm() {
  Object.assign(itemForm, { ...defaultForm })
}

function editItem(row) {
  Object.assign(itemForm, { ...defaultForm, ...row })
  if (row.Space) itemForm.spaceId = row.Space.id
  editing.value = true
  showForm.value = true
}

function openAddForm() {
  resetForm()
  editing.value = false
  showForm.value = true
}

async function handleSave() {
  if (!itemForm.name) return ElMessage.warning('请输入物品名称')
  saving.value = true
  try {
    if (editing.value) {
      await inventoryApi.updateItem(itemForm.id, itemForm)
      ElMessage.success('更新成功')
    } else {
      await inventoryApi.createItem({ ...itemForm, familyId: authStore.currentFamily?.id })
      ElMessage.success('添加成功')
    }
    saveRecentSpace(itemForm.spaceId)
    showForm.value = false
    resetForm()
    loadItems()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await inventoryApi.deleteItem(id)
    ElMessage.success('已删除')
    loadItems()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 16px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 18px;
  }
  .card {
    padding: 12px;
    border-radius: 10px;
  }
  .stat-card {
    padding: 12px;
  }
  .stat-value {
    font-size: 20px;
  }
  .stat-label {
    font-size: 12px;
  }
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.el-dialog) {
    width: 92% !important;
    margin: 0 auto;
  }
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
  :deep(.el-table) {
    font-size: 13px;
  }
  :deep(.el-table .cell) {
    padding: 0 6px;
  }
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>

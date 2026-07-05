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

    <el-dialog v-model="showForm" :title="editing ? '编辑物品' : '添加物品'" width="520px" top="8vh" destroy-on-close>
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
          <el-tree-select v-model="itemForm.spaceId" :data="spaceTreeWithRecent" :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="搜索或选择位置" style="width:100%" check-strictly filterable />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="购买日期"><el-date-picker v-model="itemForm.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保修期(月)"><el-input-number v-model="itemForm.warrantyMonths" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="过期日期"><el-date-picker v-model="itemForm.expiryDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="itemForm.tags" placeholder="用逗号分隔" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="itemForm.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ editing ? '更新' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted } from 'vue'
import { inventoryApi, dashboardApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
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
const search = ref('')
const filterSpaceId = ref(null)
const filterCategory = ref('')
const page = ref(1), pageSize = ref(20), total = ref(0)
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const loading = ref(false)
const stats = reactive({ total: 0, expiring: 0, borrowed: 0 })

const defaultForm = { name: '', quantity: 1, price: 0, category: '', spaceId: null, purchaseDate: dayjs().format('YYYY-MM-DD'), warrantyMonths: 0, expiryDate: '', tags: '', description: '', lastUsedDate: dayjs().format('YYYY-MM-DD') }
const itemForm = reactive({ ...defaultForm })

function isExpiring(date) { return date && dayjs(date).diff(dayjs(), 'day') <= 7 && dayjs(date).diff(dayjs(), 'day') >= 0 }

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

<template>
  <div class="categories-page">
    <div class="page-header">
      <div>
        <div class="page-title">分类管理</div>
        <p class="page-desc">管理记账分类，支持自定义一级和二级分类</p>
      </div>
      <el-button type="primary" @click="openCreate(null)">
        <el-icon><Plus /></el-icon>添加分类
      </el-button>
    </div>

    <!-- 类型切换 -->
    <el-tabs v-model="activeType" class="cat-tabs">
      <el-tab-pane label="支出分类" name="expense" />
      <el-tab-pane label="收入分类" name="income" />
    </el-tabs>

    <!-- 加载中 -->
    <div v-if="loading" class="empty-card card">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="card error-card">
      <el-icon :size="48" color="var(--rose-d)"><CircleCloseFilled /></el-icon>
      <p>数据加载失败，请稍后重试</p>
      <el-button type="primary" @click="loadCategories">
        🔄 重新加载
      </el-button>
    </div>

    <!-- 分类列表 -->
    <div v-else-if="treeList.length === 0" class="empty-card card">
      <el-icon :size="48" color="var(--wood-light)"><Folder /></el-icon>
      <p>暂无{{ activeType === 'expense' ? '支出' : '收入' }}分类</p>
    </div>

    <div v-else-if="treeList.length > 0" class="cat-list">
      <div v-for="cat in treeList" :key="cat.id" class="cat-group">
        <!-- 一级分类 -->
        <div class="cat-row cat-parent" :class="{ builtin: cat.builtIn }">
          <div class="cat-left">
            <div class="cat-icon" :style="{ background: cat.builtIn ? 'rgba(200, 159, 133, 0.1)' : 'rgba(52,211,153,0.1)', color: cat.builtIn ? 'var(--terracotta)' : '#10b981' }">
              <el-icon :size="18"><component :is="cat.icon || 'MoreFilled'" /></el-icon>
            </div>
            <span class="cat-name">{{ cat.name }}</span>
            <el-tag v-if="cat.builtIn" size="small" type="info" effect="plain" round>预设</el-tag>
            <span class="cat-child-count" v-if="cat.children?.length">{{ cat.children.length }} 个子分类</span>
          </div>
          <div class="cat-actions">
            <el-tooltip content="添加子分类" placement="top">
              <button class="act-btn" @click="openCreate(cat.id)" :disabled="cat.builtIn && cat.children?.length >= 10">
                <el-icon><Plus /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip v-if="!cat.builtIn" content="编辑" placement="top">
              <button class="act-btn" @click="openEdit(cat)">
                <el-icon><Edit /></el-icon>
              </button>
            </el-tooltip>
            <el-popconfirm v-if="!cat.builtIn" title="确定删除此分类？" @confirm="handleDelete(cat.id)">
              <template #reference>
                <button class="act-btn danger">
                  <el-icon><Delete /></el-icon>
                </button>
              </template>
            </el-popconfirm>
          </div>
        </div>

        <!-- 二级分类 -->
        <div v-if="cat.children?.length" class="cat-children">
          <div v-for="child in cat.children" :key="child.id" class="cat-row cat-child">
            <div class="cat-left">
              <div class="child-dot" :style="{ background: cat.builtIn ? 'var(--terracotta)' : '#10b981' }"></div>
              <span class="cat-name">{{ child.name }}</span>
              <el-tag v-if="child.builtIn" size="small" type="info" effect="plain" round>预设</el-tag>
            </div>
            <div class="cat-actions">
              <el-tooltip v-if="!child.builtIn" content="编辑" placement="top">
                <button class="act-btn" @click="openEdit(child)">
                  <el-icon><Edit /></el-icon>
                </button>
              </el-tooltip>
              <el-popconfirm v-if="!child.builtIn" title="确定删除此子分类？" @confirm="handleDelete(child.id)">
                <template #reference>
                  <button class="act-btn danger">
                    <el-icon><Delete /></el-icon>
                  </button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑分类' : '添加分类'"
      width="440px"
      class="warm-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" class="warm-form">
        <el-form-item label="分类名称">
          <el-input v-model="form.name" placeholder="如：早餐、交通补贴" maxlength="20" />
        </el-form-item>

        <el-form-item label="收支类型" v-if="!isEdit && !form.parentId">
          <el-radio-group v-model="form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="父分类" v-if="!isEdit">
          <el-select v-model="form.parentId" placeholder="无（作为一级分类）" clearable style="width:100%;">
            <el-option
              v-for="p in parentOptions"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
          <div class="form-tip">不选则为一级分类，选择后为二级分类</div>
        </el-form-item>

        <el-form-item label="图标">
          <div class="icon-picker">
            <div
              v-for="icon in iconOptions"
              :key="icon"
              class="ip-item"
              :class="{ active: form.icon === icon }"
              @click="form.icon = icon"
            >
              <el-icon :size="18"><component :is="icon" /></el-icon>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <span style="margin-left:8px;color:#94a3b8;font-size:13px;">越小越靠前</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, watch } from 'vue'
import { accountingApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const allCategories = ref([])
const activeType = ref('expense')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const loading = ref(false)
const loadError = ref(false)

const defaultForm = {
  name: '', type: 'expense', icon: 'MoreFilled', parentId: null, sort: 0
}
const form = ref({ ...defaultForm })

const iconOptions = [
  'Dish', 'Coffee', 'Food', 'IceCream',
  'Van', 'Location', 'MapLocation', 'Guide',
  'Reading', 'Notebook', 'EditPen', 'Edit',
  'FirstAidKit', 'House', 'OfficeBuilding', 'School',
  'Present', 'ShoppingCart', 'ShoppingBag', 'Goods',
  'Film', 'Headset', 'VideoCamera', 'Camera',
  'Phone', 'Message', 'ChatDotRound', 'Promotion',
  'Money', 'Wallet', 'CreditCard', 'Coin',
  'MoreFilled', 'Star', 'Flag', 'Calendar',
  'User', 'UserFilled', 'Aim', 'Trophy',
  'Suitcase', 'Box', 'Files', 'Folder',
  'Sunny', 'Moon', 'Cloudy', 'Lightning',
  'Setting', 'Tools', 'Key', 'Lock',
  'StarFilled', 'Bell', 'Timer', 'CircleCheck'
]

const treeList = computed(() => {
  const filtered = allCategories.value.filter(c => c.type === activeType.value)
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
  // 按 sort 排序
  roots.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  roots.forEach(r => r.children.sort((a, b) => (a.sort || 0) - (b.sort || 0)))
  return roots
})

const parentOptions = computed(() => {
  return allCategories.value.filter(c => c.type === form.value.type && !c.parentId)
})

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadCategories()
})

watch(activeType, () => {
  form.value.type = activeType.value
})

async function loadCategories() {
  loadError.value = false
  loading.value = true
  try {
    const res = await accountingApi.getCategories({ familyId: authStore.currentFamily?.id })
    allCategories.value = res.data
  } catch (e) {
    console.error('[Categories] 加载失败', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function openCreate(parentId) {
  isEdit.value = false
  editId.value = null
  form.value = {
    ...defaultForm,
    type: activeType.value,
    parentId: parentId || null
  }
  showDialog.value = true
}

function openEdit(cat) {
  isEdit.value = true
  editId.value = cat.id
  form.value = {
    name: cat.name,
    type: cat.type,
    icon: cat.icon || 'MoreFilled',
    parentId: cat.parentId || null,
    sort: cat.sort || 0
  }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name) return ElMessage.warning('请输入分类名称')
  saving.value = true
  try {
    const data = {
      ...form.value,
      familyId: authStore.currentFamily?.id
    }
    if (isEdit.value) {
      await accountingApi.updateCategory(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await accountingApi.createCategory(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadCategories()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await accountingApi.deleteCategory(id)
    ElMessage.success('已删除')
    loadCategories()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.categories-page {
  animation: pageIn 0.4s ease-out;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 4px;
}

/* Tabs */
.cat-tabs {
  margin-bottom: 20px;
}
.cat-tabs :deep(.el-tabs__header) {
  margin: 0;
}
.cat-tabs :deep(.el-tabs__item.is-active) {
  color: var(--terra-deep);
  font-weight: 600;
}
.cat-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, var(--terracotta), #D3A98B);
}

/* 空状态 */


/* 分类列表 */
.cat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-group {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  transition: background 0.2s;
}
.cat-row:hover {
  background: rgba(200, 159, 133, 0.03);
}

.cat-parent {
  border-bottom: 1px solid #F3EADD;
}
.cat-parent.builtin {
  background: rgba(248, 250, 252, 0.5);
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-name {
  font-size: 15px;
  font-weight: 500;
  color: #6B5744;
}

.cat-child-count {
  font-size: 12px;
  color: #A08D7A;
  margin-left: 4px;
}

/* 子分类 */
.cat-children {
  padding: 4px 0;
}
.cat-child {
  padding-left: 56px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.child-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.6;
}

/* 操作按钮 */
.cat-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.act-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A08D7A;
  transition: all 0.2s;
}
.act-btn:hover:not(:disabled) {
  background: #F3EADD;
  color: #A08D7A;
}
.act-btn.danger:hover {
  background: #fef2f2;
  color: var(--rose-d);
}
.act-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}
.ip-item {
  width: 38px;
  height: 38px;
  border: 2px solid rgba(226,205,178,.7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}
.ip-item:hover {
  border-color: var(--primary-light);
  color: var(--terra-deep);
}
.ip-item.active {
  border-color: var(--terracotta);
  background: rgba(200, 159, 133, 0.08);
  color: var(--terra-deep);
}

.form-tip {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>

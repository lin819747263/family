<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">空间管理</div>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新建空间</el-button>
    </div>

    <el-alert style="margin-bottom:16px;" title="以 家→房间→柜子→抽屉 层级管理您的家居空间" type="info" show-icon :closable="false" />

    <div class="card">
      <div v-if="spaces.length === 0" style="text-align:center;padding:60px 20px;">
        <el-icon :size="48" color="#cbd5e1"><FolderOpened /></el-icon>
        <p style="margin-top:12px;color:#94a3b8;">还没有空间，点击右上角创建</p>
      </div>
      <template v-else>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">
          <el-icon style="vertical-align:middle;"><Rank /></el-icon> 拖拽可调整排序
        </div>
        <el-tree
          :data="spaces"
          node-key="id"
          default-expand-all
          draggable
          :allow-drop="allowDrop"
          :props="{ label: 'name', children: 'children' }"
          @node-drop="handleDrop"
        >
          <template #default="{ node, data }">
            <div style="display:flex;align-items:center;justify-content:space-between;flex:1;padding-right:16px;">
              <span>
                <el-icon style="margin-right:6px;"><component :is="data.icon || 'FolderOpened'" /></el-icon>
                {{ data.name }}
                <el-tag size="small" type="info" style="margin-left:6px;">{{ levelLabel[data.level] || data.level }}</el-tag>
              </span>
              <span style="display:flex;gap:4px;align-items:center;">
                <span style="font-size:12px;color:#999;margin-right:4px;">{{ data.itemCount || 0 }} 件</span>
                <el-button v-if="data.level !== 'drawer'" text type="success" size="small" @click.stop="addChild(data)" title="添加子空间">
                  <el-icon><Plus /></el-icon>
                </el-button>
                <el-button text type="primary" size="small" @click.stop="editSpace(data)">编辑</el-button>
                <el-popconfirm title="确认删除？" @confirm.stop="handleDelete(data.id)">
                  <template #reference><el-button text type="danger" size="small" @click.stop>删除</el-button></template>
                </el-popconfirm>
              </span>
            </div>
          </template>
        </el-tree>
      </template>
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑空间' : '新建空间'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如：客厅、主卧" /></el-form-item>
        <el-form-item label="层级">
          <el-select v-model="form.level" style="width:100%">
            <el-option label="家" value="home" />
            <el-option label="房间" value="room" />
            <el-option label="柜子" value="cabinet" />
            <el-option label="抽屉" value="drawer" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级空间" v-if="form.parentName">
          <el-tag type="info" effect="plain">{{ form.parentName }}</el-tag>
        </el-form-item>
        <el-form-item label="所属空间" v-if="!form.parentName && form.level !== 'home'">
          <el-tree-select v-model="form.parentId" :data="spaceOptions" :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="选择上级空间" style="width:100%" check-strictly />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ editing ? '更新' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { inventoryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const spaces = ref([])
const spaceOptions = ref([])
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = ref({ name: '', level: 'room', parentId: null, parentName: '' })

const levelLabel = { home: '家', room: '房间', cabinet: '柜子', drawer: '抽屉' }
const childLevel = { home: 'room', room: 'cabinet', cabinet: 'drawer' }

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadSpaces()
})

async function loadSpaces() {
  const res = await inventoryApi.getSpaces({ familyId: authStore.currentFamily?.id })
  spaces.value = res.data
  spaceOptions.value = res.data
}

function openCreate() {
  form.value = { name: '', level: 'room', parentId: null, parentName: '' }
  editing.value = false
  showForm.value = true
}

function addChild(parent) {
  const nextLevel = childLevel[parent.level]
  if (!nextLevel) return ElMessage.warning('该层级不支持添加子空间')
  form.value = { name: '', level: nextLevel, parentId: parent.id, parentName: parent.name }
  editing.value = false
  showForm.value = true
}

function editSpace(data) {
  form.value = { name: data.name, level: data.level, parentId: data.parentId, id: data.id, parentName: '' }
  editing.value = true
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) return ElMessage.warning('请输入名称')
  saving.value = true
  try {
    if (editing.value) {
      await inventoryApi.updateSpace(form.value.id, { name: form.value.name, level: form.value.level })
      ElMessage.success('更新成功')
    } else {
      await inventoryApi.createSpace({ ...form.value, familyId: authStore.currentFamily?.id })
      ElMessage.success('创建成功')
    }
    showForm.value = false
    form.value = { name: '', level: 'room', parentId: null, parentName: '' }
    editing.value = false
    loadSpaces()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await inventoryApi.deleteSpace(id)
    ElMessage.success('删除成功')
    loadSpaces()
  } catch(e) { ElMessage.error(e.response?.data?.message || '删除失败') }
}

// 拖拽：不允许放入其他节点内部
function allowDrop(draggingNode, dropNode, type) {
  return type !== 'inner'
}

// 拖拽完成：批量更新排序
async function handleDrop(draggingNode, dropNode, dropType) {
  if (!draggingNode?.data || !dropNode?.data) return

  const dragId = draggingNode.data.id
  const dropId = dropNode.data.id

  // 找到同级列表：遍历 spaces 树找到包含 dragId 的数组
  let siblings = null
  function findSiblings(list) {
    if (!list) return false
    if (list.some(s => s.id === dragId)) {
      siblings = list
      return true
    }
    for (const item of list) {
      if (item.children && findSiblings(item.children)) return true
    }
    return false
  }
  findSiblings(spaces.value)

  if (!siblings) return

  const dragIdx = siblings.findIndex(s => s.id === dragId)
  const dropIdx = siblings.findIndex(s => s.id === dropId)
  if (dragIdx === -1 || dropIdx === -1) return

  // 从原位置移除，插入新位置
  const [dragged] = siblings.splice(dragIdx, 1)
  const newDropIdx = siblings.findIndex(s => s.id === dropId)
  if (dropType === 'before') {
    siblings.splice(newDropIdx, 0, dragged)
  } else {
    siblings.splice(newDropIdx + 1, 0, dragged)
  }

  // 批量更新 sort
  const updates = siblings.map((s, i) => ({ id: s.id, sort: i + 1 }))

  try {
    await Promise.all(
      updates.map(u => inventoryApi.updateSpace(u.id, { sort: u.sort }))
    )
    await loadSpaces()
    ElMessage.success('排序已更新')
  } catch {
    ElMessage.error('排序更新失败')
    loadSpaces()
  }
}
</script>

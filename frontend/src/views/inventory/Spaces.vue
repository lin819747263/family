<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-head">
      <div>
        <div class="page-title">📦 物品管理</div>
        <div class="page-sub">家里的每件东西，都有属于自己的位置</div>
      </div>
      <div class="head-actions">
        <el-button class="btn-ghost" @click="openCreate">
          <span>🪄</span> AI 录入
        </el-button>
        <el-button class="btn-primary" @click="openCreate">
          <span>＋</span> 添加物品
        </el-button>
      </div>
    </div>

    <!-- 子标签页 -->
    <div class="subtabs">
      <router-link to="/inventory" class="subtab">🗃 物品总览</router-link>
      <router-link to="/inventory/spaces" class="subtab" :class="{ active: $route.path === '/inventory/spaces' }">🏠 空间管理</router-link>
      <router-link to="/inventory/borrows" class="subtab">🤝 借物追踪</router-link>
      <router-link to="/inventory/unused" class="subtab">🍃 断舍离</router-link>
    </div>

    <!-- 提示 -->
    <div class="tree-hint reveal">
      💡 以「家 → 房间 → 柜子 → 抽屉」层级管理空间 · 拖拽可调整排序
    </div>

    <!-- 空状态 -->
    <div v-if="spaces.length === 0" class="card empty-card">
      <el-icon :size="48" color="#cbd5e1"><FolderOpened /></el-icon>
      <p>还没有空间，点击右上角创建</p>
    </div>

    <!-- 空间树 -->
    <div v-else class="card tree-card reveal">
      <template v-for="home in spaces" :key="home.id">
        <div class="tree-node">
          <div class="node-row" @click="toggleNode(home.id)">
            <div class="node-ico lv-home">🏡</div>
            <span class="node-name">{{ home.name }}</span>
            <span class="node-lvl">家</span>
            <span class="node-count">{{ home.itemCount || 0 }} 件</span>
            <div class="node-acts">
              <button class="act-btn" @click.stop="addChild(home)">＋</button>
              <button class="act-btn" @click.stop="editSpace(home)">✎</button>
            </div>
          </div>

          <!-- 房间层 -->
          <div v-if="home.children?.length" class="children">
            <div v-for="room in home.children" :key="room.id" class="tree-node">
              <div class="node-row" @click="toggleNode(room.id)">
                <div class="node-ico lv-room">{{ getRoomEmoji(room.name) }}</div>
                <span class="node-name">{{ room.name }}</span>
                <span class="node-lvl">房间</span>
                <span class="node-count">{{ room.itemCount || 0 }} 件</span>
                <div class="node-acts">
                  <button class="act-btn" @click.stop="addChild(room)">＋</button>
                  <button class="act-btn" @click.stop="editSpace(room)">✎</button>
                </div>
              </div>

              <!-- 柜子层 -->
              <div v-if="room.children?.length" class="children">
                <div v-for="cab in room.children" :key="cab.id" class="tree-node">
                  <div class="node-row" @click="toggleNode(cab.id)">
                    <div class="node-ico lv-cab">{{ getCabEmoji(cab.name) }}</div>
                    <span class="node-name">{{ cab.name }}</span>
                    <span class="node-lvl">柜子</span>
                    <span class="node-count">{{ cab.itemCount || 0 }} 件</span>
                    <div class="node-acts">
                      <button class="act-btn" @click.stop="addChild(cab)">＋</button>
                      <button class="act-btn" @click.stop="editSpace(cab)">✎</button>
                    </div>
                  </div>

                  <!-- 抽屉层 -->
                  <div v-if="cab.children?.length" class="children">
                    <div v-for="draw in cab.children" :key="draw.id" class="tree-node">
                      <div class="node-row">
                        <div class="node-ico lv-draw">🗃</div>
                        <span class="node-name">{{ draw.name }}</span>
                        <span class="node-lvl">抽屉</span>
                        <span class="node-count">{{ draw.itemCount || 0 }} 件</span>
                        <div class="node-acts">
                          <button class="act-btn" @click.stop="editSpace(draw)">✎</button>
                          <el-popconfirm title="确认删除？" @confirm="handleDelete(draw.id)">
                            <template #reference>
                              <button class="act-btn danger" @click.stop>🗑</button>
                            </template>
                          </el-popconfirm>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 新建/编辑弹窗 -->
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
import { ref, onMounted, nextTick } from 'vue'
import { inventoryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const spaces = ref([])
const spaceOptions = ref([])
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = ref({ name: '', level: 'room', parentId: null, parentName: '' })

const childLevel = { home: 'room', room: 'cabinet', cabinet: 'drawer' }

// 房间 emoji 映射
function getRoomEmoji(name) {
  const map = { '客厅': '🛋', '厨房': '🍳', '主卧': '🛏', '儿童房': '🧒', '书房': '📖', '阳台': '🌿', '卫生间': '🚿', '储物间': '📦' }
  return map[name] || '🏠'
}

// 柜子 emoji 映射
function getCabEmoji(name) {
  const map = { '冰箱': '🧊', '衣柜': '🚪', '药箱': '💊', '电视柜': '🗄', '吊柜': '🚪', '书架': '📚', '玩具书架': '📚' }
  return map[name] || '🗄'
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadSpaces()
  nextTick(setupReveal)
})

async function loadSpaces() {
  const res = await inventoryApi.getSpaces({ familyId: authStore.currentFamily?.id })
  spaces.value = res.data
  spaceOptions.value = res.data
}

function toggleNode(id) {
  // 可选：展开/折叠逻辑
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
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.page-sub {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--text-secondary);
}
.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== 按钮 ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2;
  box-shadow: 0 8px 20px rgba(200,159,133,.4);
  transition: transform .3s, box-shadow .3s;
}
.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.3);
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: 1.5px solid var(--border);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,253,250,.85);
  color: var(--terra-deep);
  transition: transform .3s, box-shadow .3s;
}
.btn-ghost:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.15);
}

/* ===== 子标签页 ===== */
.subtabs {
  display: flex;
  gap: 6px;
  background: rgba(243,234,221,.6);
  border: 1px solid var(--border);
  padding: 5px;
  border-radius: 16px;
  margin-bottom: 22px;
  overflow-x: auto;
}
.subtab {
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all .3s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 7px;
}
.subtab:hover { color: var(--terra-deep); }
.subtab.active,
.subtab.router-link-exact-active {
  background: var(--bg-card);
  color: var(--terra-deep);
  box-shadow: 0 4px 14px rgba(160,120,90,.14);
}

/* ===== 提示 ===== */
.tree-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

/* ===== 空状态 ===== */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-card p {
  margin-top: 12px;
  color: var(--text-secondary);
}

/* ===== 空间树 ===== */
.tree-card {
  padding: 18px;
}
.tree-node {
  position: relative;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 13px;
  transition: background .25s;
  cursor: pointer;
}
.node-row:hover {
  background: rgba(243,234,221,.7);
}
.node-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}
.lv-home { background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); }
.lv-room { background: linear-gradient(135deg, var(--amber), #C08A3E); }
.lv-cab { background: linear-gradient(135deg, var(--sage), #7E8862); }
.lv-draw { background: linear-gradient(135deg, var(--sky), #6E8CA0); }

.node-name {
  font-size: 14.5px;
  font-weight: 700;
}
.node-lvl {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--apricot);
  color: var(--terra-deep);
}
.node-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}
.node-acts {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity .25s;
}
.node-row:hover .node-acts {
  opacity: 1;
}
.children {
  margin-left: 26px;
  padding-left: 16px;
  border-left: 2px dashed var(--wood-light);
}

/* ===== 操作按钮 ===== */
.act-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(255,253,250,.9);
  color: var(--terra-deep);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(160,120,90,.15);
  transition: all .2s;
}
.act-btn:hover {
  background: var(--terracotta);
  color: #fff;
}
.act-btn.danger:hover {
  background: #B06A6A;
}

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .page-head {
    gap: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .subtabs {
    gap: 4px;
    padding: 4px;
  }
  .subtab {
    padding: 8px 12px;
    font-size: 13px;
  }
  .node-acts {
    opacity: 1;
  }
  .node-row {
    gap: 8px;
    padding: 10px 10px;
  }
  .node-ico {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  .node-name {
    font-size: 13.5px;
  }
  .children {
    margin-left: 16px;
    padding-left: 10px;
  }
}
</style>

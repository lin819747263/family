<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">家庭心愿</div>
        <p class="page-desc">记录家庭心愿，一起努力实现</p>
      </div>
      <div class="header-actions">
        <el-select v-model="filterStatus" clearable placeholder="全部状态" size="small" style="width:120px;" @change="loadList">
          <el-option label="待实现" value="pending" />
          <el-option label="已实现" value="fulfilled" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>许愿</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" v-if="!loading && list.length > 0">
      <div class="mini-stat">
        <span class="ms-num">{{ list.length }}</span>
        <span class="ms-lbl">全部心愿</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num pending">{{ pendingCount }}</span>
        <span class="ms-lbl">待实现</span>
      </div>
      <div class="mini-stat">
        <span class="ms-num done">{{ fulfilledCount }}</span>
        <span class="ms-lbl">已实现</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 空状态 -->
    <div v-else-if="list.length === 0" class="card empty-card">
      <el-icon :size="56" color="var(--wood-light)"><Star /></el-icon>
      <p class="empty-title">还没有心愿</p>
      <p class="empty-desc">添加家庭心愿，一起努力实现它</p>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>许下第一个心愿
      </el-button>
    </div>

    <!-- 心愿列表 -->
    <div v-else class="wish-grid">
      <div v-for="item in list" :key="item.id" class="wish-card card" :class="[item.status, `priority-${item.priority}`]">
        <div class="wish-header">
          <div class="wish-priority">
            <el-tag :type="priorityType(item.priority)" size="small" effect="plain">{{ priorityLabel(item.priority) }}</el-tag>
          </div>
          <div class="wish-actions">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item)">
              <button class="wish-more"><el-icon><MoreFilled /></el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="item.status === 'pending'" command="fulfill">
                    <el-icon><Check /></el-icon>标记实现
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.status === 'pending'" command="cancel">
                    <el-icon><Close /></el-icon>取消心愿
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.status !== 'pending'" command="restore">
                    <el-icon><RefreshLeft /></el-icon>恢复为待实现
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="wish-body">
          <img v-if="item.image" :src="item.image" class="wish-image" loading="lazy" />
          <div class="wish-title">{{ item.title }}</div>
          <div v-if="item.description" class="wish-desc">{{ item.description }}</div>
          <div v-if="item.price" class="wish-price">¥{{ parseFloat(item.price).toFixed(2) }}</div>
        </div>

        <div class="wish-footer">
          <div class="wish-meta">
            <el-avatar :size="20" :src="item.creator?.avatar" class="wish-avatar">{{ (item.creator?.nickname || '?')[0] }}</el-avatar>
            <span class="wish-creator">{{ item.creator?.nickname || '未知' }}</span>
          </div>
          <div v-if="item.status === 'fulfilled' && item.fulfilledAt" class="wish-fulfilled">
            <el-icon><Check /></el-icon> {{ item.fulfilledAt }} 实现
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑心愿' : '许下心愿'" width="480px" destroy-on-close class="warm-dialog">
      <el-form :model="form" label-width="80px" class="warm-form">
        <el-form-item label="心愿标题">
          <el-input v-model="form.title" placeholder="写下你的心愿" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述（可选）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="预估价格">
          <el-input v-model="form.price" type="number" step="0.01" placeholder="可选">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio-button value="low">低</el-radio-button>
            <el-radio-button value="medium">中</el-radio-button>
            <el-radio-button value="high">高</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="心愿图片">
          <el-upload
            :http-request="uploadImage"
            :show-file-list="false"
            accept="image/*"
            list-type="picture-card"
          >
            <img v-if="form.image" :src="form.image" style="width:100%;height:100%;object-fit:cover;" />
            <el-icon v-else><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '许愿' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { wishlistApi, momentApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const list = ref([])
const loading = ref(false)
const filterStatus = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)

const form = reactive({ title: '', description: '', price: '', priority: 'medium', image: '' })

async function uploadImage({ file }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('familyId', authStore.currentFamily.id)
    const res = await momentApi.uploadImage(formData)
    form.image = res.data.url
    ElMessage.success('图片已上传')
  } catch (e) { ElMessage.error('上传失败') }
}

const pendingCount = computed(() => list.value.filter(w => w.status === 'pending').length)
const fulfilledCount = computed(() => list.value.filter(w => w.status === 'fulfilled').length)

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily.id }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await wishlistApi.getList(params)
    list.value = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.title = ''
  form.description = ''
  form.price = ''
  form.priority = 'medium'
  showDialog.value = true
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.title = item.title
  form.description = item.description || ''
  form.price = item.price || ''
  form.priority = item.priority || 'medium'
  showDialog.value = true
}

async function handleSave() {
  if (!form.title.trim()) return ElMessage.warning('请输入心愿标题')
  saving.value = true
  try {
    if (isEdit.value) {
      await wishlistApi.update(editId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await wishlistApi.create({ ...form, familyId: authStore.currentFamily.id })
      ElMessage.success('许愿成功 ✨')
    }
    showDialog.value = false
    loadList()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleCommand(cmd, item) {
  if (cmd === 'fulfill') {
    await wishlistApi.update(item.id, { status: 'fulfilled' })
    ElMessage.success('🎉 恭喜！心愿已实现')
    loadList()
  } else if (cmd === 'cancel') {
    await wishlistApi.update(item.id, { status: 'cancelled' })
    ElMessage.success('已取消')
    loadList()
  } else if (cmd === 'restore') {
    await wishlistApi.update(item.id, { status: 'pending', fulfilledAt: null })
    ElMessage.success('已恢复')
    loadList()
  } else if (cmd === 'edit') {
    openEdit(item)
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定删除这个心愿？', '确认删除', { type: 'warning' })
      await wishlistApi.remove(item.id)
      ElMessage.success('已删除')
      loadList()
    } catch { /* cancelled */ }
  }
}

function priorityLabel(p) {
  return { low: '低', medium: '中', high: '高' }[p] || '中'
}
function priorityType(p) {
  return { low: 'info', medium: '', high: 'danger' }[p] || ''
}
</script>

<style scoped>
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
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.mini-stat {
  flex: 1;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.ms-num {
  font-size: 24px;
  font-weight: 700;
  color: #6B5744;
}
.ms-num.pending { color: var(--terra-deep); }
.ms-num.done { color: #34d399; }
.ms-lbl {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 4px;
}

/* 空状态 */

/* 心愿网格 */
.wish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.wish-card {
  padding: 0;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}
.wish-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.wish-card.fulfilled {
  opacity: 0.75;
}
.wish-card.fulfilled .wish-title {
  text-decoration: line-through;
  color: #A08D7A;
}
.wish-card.cancelled {
  opacity: 0.5;
}
.wish-card.priority-high {
  border-left: 3px solid var(--rose-d);
}
.wish-card.priority-medium {
  border-left: 3px solid var(--terracotta);
}
.wish-card.priority-low {
  border-left: 3px solid #A08D7A;
}

.wish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 0;
}
.wish-more {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A08D7A;
  transition: all 0.2s;
}
.wish-more:hover {
  background: #F3EADD;
  color: #A08D7A;
}

.wish-body {
  padding: 12px 16px;
}
.wish-image {
  width: 100%; height: 140px; object-fit: cover;
  border-radius: 10px; margin-bottom: 12px;
}
.wish-title {
  font-size: 16px;
  font-weight: 600;
  color: #6B5744;
  line-height: 1.4;
}
.wish-desc {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wish-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--rose-d);
  margin-top: 10px;
}

.wish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #F3EADD;
  background: #fafbfc;
}
.wish-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wish-avatar {
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}
.wish-creator {
  font-size: 12px;
  color: #A08D7A;
}
.wish-fulfilled {
  font-size: 12px;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .stats-row {
    gap: 10px;
  }
  .mini-stat {
    padding: 12px;
  }
  .ms-num {
    font-size: 20px;
  }
  .wish-grid {
    grid-template-columns: 1fr;
  }
}
</style>

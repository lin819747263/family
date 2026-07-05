<template>
  <div class="recipe-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <div class="page-title">菜谱管理</div>
        <p class="page-desc">记录家庭美食，分享烹饪心得</p>
      </div>
      <div class="header-actions">
        <el-input v-model="keyword" placeholder="搜索菜谱..." clearable style="width:180px;" @clear="loadList" @keyup.enter="loadList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterDifficulty" placeholder="难度" clearable style="width:100px;" @change="loadList">
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新建菜谱</el-button>
      </div>
    </div>

    <!-- 菜谱列表 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <div v-else-if="list.length === 0" class="empty-card card">
      <el-icon :size="56" color="#cbd5e1"><Dish /></el-icon>
      <p class="empty-title">还没有菜谱</p>
      <p class="empty-desc">点击右上角创建你的第一个菜谱吧</p>
      <el-button type="primary" @click="openCreate" style="margin-top:12px;"><el-icon><Plus /></el-icon>创建菜谱</el-button>
    </div>
    <div v-else class="recipe-grid">
      <div v-for="item in list" :key="item.id" class="recipe-card card" @click="openView(item)">
        <div class="rc-image">
          <img v-if="item.image" :src="item.image" :alt="item.name" />
          <div v-else class="rc-placeholder">
            <el-icon :size="36" color="#cbd5e1"><Dish /></el-icon>
          </div>
          <div class="rc-difficulty" :class="item.difficulty">
            {{ difficultyLabel(item.difficulty) }}
          </div>
        </div>
        <div class="rc-body">
          <div class="rc-name">{{ item.name }}</div>
          <div class="rc-desc">{{ item.description || '暂无描述' }}</div>
          <div class="rc-meta">
            <span v-if="item.cookingTime"><el-icon><Timer /></el-icon> {{ item.cookingTime }}分钟</span>
            <span v-if="item.servings"><el-icon><User /></el-icon> {{ item.servings }}人份</span>
            <span><el-icon><List /></el-icon> {{ (item.ingredients || []).length }}种材料</span>
          </div>
        </div>
        <div class="rc-actions" @click.stop>
          <el-popconfirm title="确定删除此菜谱？" @confirm="handleDelete(item.id)">
            <template #reference>
              <button class="act-btn danger"><el-icon><Delete /></el-icon></button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadList"
      />
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑菜谱' : '新建菜谱'"
      width="680px"
      class="recipe-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="80px">
        <!-- 封面图 -->
        <el-form-item label="封面图">
          <div class="upload-area" @click="triggerUpload">
            <img v-if="form.image" :src="form.image" class="upload-preview" />
            <div v-else class="upload-placeholder">
              <el-icon :size="28"><Plus /></el-icon>
              <span>点击上传</span>
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display:none;" @change="handleUpload" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="菜名">
              <el-input v-model="form.name" placeholder="如：红烧肉、番茄炒蛋" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-select v-model="form.difficulty" style="width:100%;">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简单描述这道菜..." />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="烹饪时长">
              <el-input v-model.number="form.cookingTime" type="number" placeholder="分钟">
                <template #append>分钟</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="几人份">
              <el-input v-model.number="form.servings" type="number" placeholder="人数">
                <template #append>人份</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 材料列表 -->
        <el-form-item label="材料">
          <div class="dynamic-list">
            <div v-for="(ing, idx) in form.ingredients" :key="idx" class="dynamic-row">
              <el-input v-model="ing.name" placeholder="材料名称" style="flex:2;" />
              <el-input v-model="ing.amount" placeholder="用量" style="flex:1;" />
              <button class="dyn-remove" @click="form.ingredients.splice(idx, 1)"><el-icon><Delete /></el-icon></button>
            </div>
            <el-button text type="primary" @click="form.ingredients.push({ name: '', amount: '' })">
              <el-icon><Plus /></el-icon>添加材料
            </el-button>
          </div>
        </el-form-item>

        <!-- 步骤列表 -->
        <el-form-item label="步骤">
          <div class="dynamic-list">
            <div v-for="(step, idx) in form.steps" :key="idx" class="dynamic-row step-row">
              <div class="step-num">{{ idx + 1 }}</div>
              <el-input v-model="step.text" type="textarea" :rows="2" placeholder="描述这一步..." style="flex:1;" />
              <button class="dyn-remove" @click="form.steps.splice(idx, 1)"><el-icon><Delete /></el-icon></button>
            </div>
            <el-button text type="primary" @click="form.steps.push({ text: '', image: '' })">
              <el-icon><Plus /></el-icon>添加步骤
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看弹窗 -->
    <el-dialog
      v-model="showView"
      width="880px"
      class="view-dialog"
      destroy-on-close
    >
      <template #header>
        <div class="view-header">
          <span class="view-title">{{ viewData.name }}</span>
          <el-button type="primary" text @click="showView = false; openEdit(viewData)">
            <el-icon><Edit /></el-icon>编辑
          </el-button>
        </div>
      </template>

      <div class="view-body">
        <!-- 左侧：图片 + 基本信息 -->
        <div class="view-left">
          <div v-if="viewData.image" class="view-cover">
            <img :src="viewData.image" :alt="viewData.name" />
          </div>
          <div v-else class="view-cover-placeholder">
            <el-icon :size="48" color="#cbd5e1"><Dish /></el-icon>
          </div>
          <div class="view-info">
            <div class="vi-tags">
              <span class="vi-tag difficulty" :class="viewData.difficulty">{{ difficultyLabel(viewData.difficulty) }}</span>
              <span v-if="viewData.cookingTime" class="vi-tag"><el-icon><Timer /></el-icon> {{ viewData.cookingTime }}分钟</span>
              <span v-if="viewData.servings" class="vi-tag"><el-icon><User /></el-icon> {{ viewData.servings }}人份</span>
            </div>
            <p v-if="viewData.description" class="vi-desc">{{ viewData.description }}</p>
          </div>
        </div>

        <!-- 右侧：材料 + 步骤 -->
        <div class="view-right">
          <!-- 材料 -->
          <div v-if="viewData.ingredients?.length" class="view-section">
            <div class="vs-title">
              <el-icon><ShoppingCart /></el-icon>用料
              <span class="vs-count">{{ viewData.ingredients.length }}种</span>
            </div>
            <div class="ingredient-list">
              <div v-for="(ing, idx) in viewData.ingredients" :key="idx" class="ing-row">
                <span class="ing-name">{{ ing.name }}</span>
                <span class="ing-amount">{{ ing.amount }}</span>
              </div>
            </div>
          </div>

          <!-- 步骤 -->
          <div v-if="viewData.steps?.length" class="view-section">
            <div class="vs-title">
              <el-icon><List /></el-icon>做法
              <span class="vs-count">{{ viewData.steps.length }}步</span>
            </div>
            <div class="step-list">
              <div v-for="(step, idx) in viewData.steps" :key="idx" class="step-item">
                <div class="step-badge">{{ idx + 1 }}</div>
                <div class="step-text">{{ step.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { recipeApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const filterDifficulty = ref('')

// 查看弹窗
const showView = ref(false)
const viewData = ref({})

// 编辑弹窗
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const fileInput = ref(null)

const defaultForm = {
  name: '', description: '', image: '',
  ingredients: [], steps: [],
  cookingTime: null, servings: null, difficulty: 'medium'
}
const form = ref({ ...defaultForm, ingredients: [], steps: [] })

const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' }
function difficultyLabel(d) { return difficultyMap[d] || '中等' }

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const params = {
      familyId: authStore.currentFamily?.id,
      page: page.value,
      pageSize: pageSize.value
    }
    if (keyword.value) params.keyword = keyword.value
    if (filterDifficulty.value) params.difficulty = filterDifficulty.value
    const res = await recipeApi.getList(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openView(item) {
  viewData.value = {
    ...item,
    ingredients: item.ingredients || [],
    steps: item.steps || []
  }
  showView.value = true
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.value = { ...defaultForm, ingredients: [{ name: '', amount: '' }], steps: [{ text: '', image: '' }] }
  showDialog.value = true
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    name: item.name,
    description: item.description || '',
    image: item.image || '',
    ingredients: (item.ingredients || []).length ? item.ingredients.map(i => ({ ...i })) : [{ name: '', amount: '' }],
    steps: (item.steps || []).length ? item.steps.map(s => ({ ...s })) : [{ text: '', image: '' }],
    cookingTime: item.cookingTime,
    servings: item.servings,
    difficulty: item.difficulty || 'medium'
  }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name) return ElMessage.warning('请输入菜谱名称')
  // 过滤空材料和空步骤
  const data = {
    ...form.value,
    ingredients: form.value.ingredients.filter(i => i.name.trim()),
    steps: form.value.steps.filter(s => s.text.trim()),
    familyId: authStore.currentFamily?.id
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await recipeApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await recipeApi.create(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadList()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await recipeApi.remove(id)
    ElMessage.success('已删除')
    loadList()
  } catch (e) { console.error(e) }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await recipeApi.uploadImage(formData)
    form.value.image = res.data.url
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') }
  e.target.value = ''
}
</script>

<style scoped>
.recipe-page {
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
  flex-wrap: wrap;
  gap: 12px;
}
.page-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 加载和空状态 */
.loading-state {
  text-align: center;
  padding: 60px;
}
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #64748b;
  margin-top: 16px;
}
.empty-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 6px;
}

/* 菜谱网格 */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* 菜谱卡片 */
.recipe-card {
  cursor: pointer;
  transition: all 0.25s;
  padding: 0;
  overflow: hidden;
  position: relative;
}
.recipe-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.08);
}

.rc-image {
  height: 180px;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
}
.rc-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rc-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}
.rc-difficulty {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}
.rc-difficulty.easy {
  background: rgba(52,211,153,0.2);
  color: #10b981;
}
.rc-difficulty.medium {
  background: rgba(251,191,36,0.2);
  color: #d97706;
}
.rc-difficulty.hard {
  background: rgba(248,113,113,0.2);
  color: #ef4444;
}

.rc-body {
  padding: 16px;
}
.rc-name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}
.rc-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rc-meta {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #64748b;
}
.rc-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rc-actions {
  position: absolute;
  top: 10px;
  left: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}
.recipe-card:hover .rc-actions {
  opacity: 1;
}

.act-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
}
.act-btn:hover {
  background: #fff;
  color: #64748b;
}
.act-btn.danger:hover {
  color: #f87171;
}

/* 分页 */
.pagination-wrap {
  text-align: center;
  padding: 20px 0;
}

/* 弹窗 */
.recipe-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
.recipe-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}
.recipe-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
}
.recipe-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 65vh;
  overflow-y: auto;
}

/* 上传区域 */
.upload-area {
  width: 160px;
  height: 120px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-area:hover {
  border-color: #667eea;
  background: rgba(102,126,234,0.03);
}
.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
}

/* 动态列表 */
.dynamic-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dynamic-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.step-row {
  align-items: flex-start;
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}
.dyn-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  flex-shrink: 0;
  transition: all 0.2s;
}
.dyn-remove:hover {
  background: #fef2f2;
  color: #f87171;
}

/* 查看弹窗 */
.view-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
.view-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}
.view-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.view-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

/* 左右布局 */
.view-body {
  display: flex;
  min-height: 400px;
}
.view-left {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}
.view-right {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  max-height: 65vh;
}

.view-cover {
  width: 100%;
  height: 240px;
  overflow: hidden;
}
.view-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.view-cover-placeholder {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.view-info {
  padding: 16px;
  flex: 1;
}
.vi-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.vi-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.vi-tag.difficulty.easy { background: rgba(52,211,153,0.1); color: #10b981; }
.vi-tag.difficulty.medium { background: rgba(251,191,36,0.1); color: #d97706; }
.vi-tag.difficulty.hard { background: rgba(248,113,113,0.1); color: #ef4444; }
.vi-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.view-section {
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
}
.view-section:first-child {
  border-top: none;
}
.vs-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.vs-title .el-icon {
  color: #667eea;
}
.vs-count {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 材料列表 */
.ingredient-list {
  display: flex;
  flex-direction: column;
}
.ing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
}
.ing-row:last-child {
  border-bottom: none;
}
.ing-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}
.ing-amount {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

/* 步骤列表 */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step-item {
  display: flex;
  gap: 10px;
}
.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.step-text {
  flex: 1;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
  padding-top: 2px;
}

@media (max-width: 640px) {
  .view-body {
    flex-direction: column;
  }
  .view-left {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
  }
  .view-right {
    max-height: none;
  }
  .recipe-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .recipe-dialog :deep(.el-dialog),
  .view-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 92vw !important;
  }
  .recipe-dialog :deep(.el-dialog__header),
  .view-dialog :deep(.el-dialog__header) {
    padding: 16px 16px 12px;
  }
  .recipe-dialog :deep(.el-dialog__body),
  .view-dialog :deep(.el-dialog__body) {
    padding: 12px 16px 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>

<template>
  <div>
    <div v-if="!embedded" class="page-header">
      <div>
        <div class="page-title">家庭日记</div>
        <p class="page-desc">用文字记录家庭生活的美好瞬间</p>
      </div>
      <div class="header-actions">
        <el-input v-model="searchKeyword" placeholder="搜索日记" clearable size="small" style="width:180px;" @keyup.enter="loadList" @clear="loadList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="openCreate"><el-icon><EditPen /></el-icon>写日记</el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 空状态 -->
    <div v-else-if="list.length === 0" class="card empty-card">
      <el-icon :size="56" color="#cbd5e1"><Notebook /></el-icon>
      <p class="empty-title">{{ searchKeyword ? '没有找到相关日记' : '还没有日记' }}</p>
      <p class="empty-desc">{{ searchKeyword ? '换个关键词试试' : '写下第一篇家庭日记吧' }}</p>
      <el-button v-if="!searchKeyword" type="primary" @click="openCreate" style="margin-top:12px;">
        <el-icon><EditPen /></el-icon>写第一篇日记
      </el-button>
    </div>

    <!-- 日记列表 -->
    <div v-else class="diary-list">
      <div v-for="item in list" :key="item.id" class="diary-card card" @click="openView(item)">
        <div class="diary-header">
          <div class="diary-meta">
            <el-avatar :size="28" :src="item.creator?.avatar" class="diary-avatar">{{ (item.creator?.nickname || '?')[0] }}</el-avatar>
            <span class="diary-author">{{ item.creator?.nickname || '未知' }}</span>
            <span class="diary-date">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="diary-tags">
            <span v-if="item.mood" class="diary-tag">{{ item.mood }}</span>
            <span v-if="item.weather" class="diary-tag">{{ item.weather }}</span>
          </div>
        </div>
        <div class="diary-title">{{ item.title }}</div>
        <div class="diary-preview">{{ getPreview(item.content) }}</div>
        <div class="diary-footer">
          <span class="diary-word-count">{{ getWordCount(item.content) }} 字</span>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="currentPage" @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 查看日记弹窗 -->
    <el-drawer v-model="showView" :title="viewItem?.title" size="600px" class="diary-view-drawer">
      <template #header>
        <div class="view-header">
          <div class="view-title">{{ viewItem?.title }}</div>
          <div class="view-meta">
            <el-avatar :size="24" :src="viewItem?.creator?.avatar">{{ (viewItem?.creator?.nickname || '?')[0] }}</el-avatar>
            <span>{{ viewItem?.creator?.nickname }}</span>
            <span class="view-date">{{ formatDate(viewItem?.createdAt) }}</span>
            <span v-if="viewItem?.mood" class="view-tag">{{ viewItem?.mood }}</span>
            <span v-if="viewItem?.weather" class="view-tag">{{ viewItem?.weather }}</span>
          </div>
        </div>
      </template>
      <div class="view-content markdown-body" v-html="renderedContent"></div>
      <template #footer>
        <div class="view-footer">
          <el-button v-if="isAuthor(viewItem)" @click="openEdit(viewItem)"><el-icon><Edit /></el-icon>编辑</el-button>
          <el-popconfirm v-if="isAuthor(viewItem)" title="确定删除这篇日记？" @confirm="handleDelete(viewItem.id)">
            <template #reference><el-button type="danger" text><el-icon><Delete /></el-icon>删除</el-button></template>
          </el-popconfirm>
        </div>
      </template>
    </el-drawer>

    <!-- 编辑器全屏遮罩 -->
    <Teleport to="body">
      <Transition name="editor-fade">
        <div v-if="showEdit" class="editor-overlay" :class="{ fullscreen: isFullscreen }">
          <!-- 顶部工具栏 -->
          <div class="editor-topbar">
            <div class="editor-topbar-left">
              <button class="editor-btn" @click="showEdit = false" title="返回">
                <el-icon><ArrowLeft /></el-icon>
              </button>
              <span class="editor-topbar-title">{{ isEdit ? '编辑日记' : '写日记' }}</span>
            </div>
            <div class="editor-topbar-right">
              <button class="editor-btn" :class="{ active: isFullscreen }" @click="isFullscreen = !isFullscreen" title="全屏">
                <el-icon><FullScreen v-if="!isFullscreen" /><ScaleToOriginal v-else /></el-icon>
              </button>
              <button class="editor-btn" :class="{ active: showPreview }" @click="showPreview = !showPreview" title="预览">
                <el-icon><View /></el-icon>
              </button>
              <el-button type="primary" size="small" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '发表' }}</el-button>
            </div>
          </div>

          <!-- 标题和元信息 -->
          <div class="editor-meta-bar">
            <input v-model="editForm.title" class="editor-title-input" placeholder="日记标题" maxlength="100" />
            <div class="editor-meta-fields">
              <input v-model="editForm.mood" class="editor-meta-input" placeholder="💭 心情" />
              <input v-model="editForm.weather" class="editor-meta-input" placeholder="🌤 天气" />
            </div>
          </div>

          <!-- Markdown 工具栏 -->
          <div class="editor-toolbar">
            <button class="toolbar-btn" @click="insertMd('**', '**')" title="粗体"><b>B</b></button>
            <button class="toolbar-btn" @click="insertMd('*', '*')" title="斜体"><i>I</i></button>
            <button class="toolbar-btn" @click="insertMd('~~', '~~')" title="删除线"><s>S</s></button>
            <span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertMd('# ', '')" title="标题1">H1</button>
            <button class="toolbar-btn" @click="insertMd('## ', '')" title="标题2">H2</button>
            <button class="toolbar-btn" @click="insertMd('### ', '')" title="标题3">H3</button>
            <span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertMd('- ', '')" title="列表">☰</button>
            <button class="toolbar-btn" @click="insertMd('> ', '')" title="引用">❝</button>
            <button class="toolbar-btn" @click="insertMd('`', '`')" title="代码">⌨</button>
            <span class="toolbar-divider"></span>
            <el-upload :http-request="uploadImage" :show-file-list="false" accept="image/*" style="display:inline-block;">
              <button class="toolbar-btn" title="插入图片"><el-icon><PictureFilled /></el-icon></button>
            </el-upload>
          </div>

          <!-- 编辑区 + 预览区 -->
          <div class="editor-body" :class="{ 'split-mode': showPreview && !isMobile }">
            <!-- 编辑区 -->
            <div class="editor-pane" v-show="!showPreview || !isMobile">
              <textarea
                ref="contentInput"
                v-model="editForm.content"
                class="editor-textarea"
                placeholder="用 Markdown 写下你的故事..."
                @input="onContentInput"
              ></textarea>
            </div>
            <!-- 预览区 -->
            <div class="preview-pane" v-show="showPreview">
              <div class="preview-content markdown-body" v-html="previewHtml"></div>
            </div>
          </div>

          <!-- 底部状态栏 -->
          <div class="editor-statusbar">
            <span class="status-item">{{ wordCount }} 字</span>
            <span class="status-item">{{ lineCount }} 行</span>
            <span class="status-item">Markdown</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useFamilyGuard } from '@/composables/useFamilyGuard'
import { diaryApi, momentApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { renderMarkdownSafe } from '@/utils/format'
import dayjs from 'dayjs'

const props = defineProps({ embedded: Boolean })
const authStore = useAuthStore()
const list = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showView = ref(false)
const showEdit = ref(false)
const showPreview = ref(false)
const isFullscreen = ref(true) // 默认全屏
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const viewItem = ref(null)
const contentInput = ref(null)
const isMobile = ref(window.innerWidth <= 768)

const editForm = reactive({ title: '', content: '', mood: '', weather: '' })

const renderedContent = computed(() => renderMarkdownSafe(viewItem.value?.content))

const previewHtml = computed(() => {
  if (!editForm.content) return '<p style="color:#94a3b8;">开始编写后实时预览...</p>'
  return renderMarkdownSafe(editForm.content)
})

const wordCount = computed(() => {
  if (!editForm.content) return 0
  return editForm.content.replace(/\s/g, '').length
})

const lineCount = computed(() => {
  if (!editForm.content) return 0
  return editForm.content.split('\n').length
})

// 监听窗口大小变化
function handleResize() {
  isMobile.value = window.innerWidth <= 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

// 移动端自动隐藏预览
watch(showEdit, (val) => {
  if (val && isMobile.value) showPreview.value = false
})

function formatDate(d) { return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '' }

function getPreview(content) {
  if (!content) return ''
  const text = content.replace(/[#*>\-`~\[\]()]/g, '').replace(/\n/g, ' ').trim()
  return text.length > 120 ? text.slice(0, 120) + '...' : text
}

function getWordCount(content) {
  if (!content) return 0
  return content.replace(/\s/g, '').length
}

function isAuthor(item) { return item?.createdBy === authStore.user?.id }

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const params = { familyId: authStore.currentFamily.id, page: currentPage.value, pageSize: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await diaryApi.getList(params)
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function handlePageChange(page) { currentPage.value = page; loadList() }

function openCreate() {
  isEdit.value = false
  editId.value = null
  editForm.title = ''
  editForm.content = ''
  editForm.mood = ''
  editForm.weather = ''
  showPreview.value = !isMobile.value // 桌面端默认显示预览
  isFullscreen.value = true
  showEdit.value = true
  nextTick(() => contentInput.value?.focus())
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  editForm.title = item.title
  editForm.content = item.content || ''
  editForm.mood = item.mood || ''
  editForm.weather = item.weather || ''
  showPreview.value = !isMobile.value
  isFullscreen.value = true
  showView.value = false
  showEdit.value = true
  nextTick(() => contentInput.value?.focus())
}

async function openView(item) {
  try {
    const res = await diaryApi.getOne(item.id)
    viewItem.value = res.data
    showView.value = true
  } catch (e) { console.error(e) }
}

function insertMd(before, after) {
  const el = contentInput.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const text = editForm.content
  const selected = text.slice(start, end)
  editForm.content = text.slice(0, start) + before + selected + after + text.slice(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

function onContentInput(e) {
  editForm.content = e.target.value
}

async function uploadImage({ file }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('familyId', authStore.currentFamily.id)
    const res = await momentApi.uploadImage(formData)
    const url = res.data.url
    insertMd(`![图片](${url})`, '')
    ElMessage.success('图片已插入')
  } catch (e) { ElMessage.error('上传失败') }
}

async function handleSave() {
  if (!editForm.title.trim()) return ElMessage.warning('请输入日记标题')
  if (!editForm.content.trim()) return ElMessage.warning('请输入日记内容')
  saving.value = true
  try {
    if (isEdit.value) {
      await diaryApi.update(editId.value, { ...editForm })
      ElMessage.success('更新成功')
    } else {
      await diaryApi.create({ ...editForm, familyId: authStore.currentFamily.id })
      ElMessage.success('发表成功 ✍️')
    }
    showEdit.value = false
    loadList()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await diaryApi.remove(id)
    ElMessage.success('已删除')
    showView.value = false
    loadList()
  } catch (e) { console.error(e) }
}

defineExpose({ openCreate })
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-desc { font-size: 14px; color: #A08D7A; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

/* 空状态 */
.empty-card { text-align: center; padding: 60px 20px; }
.empty-title { font-size: 16px; font-weight: 600; color: #A08D7A; margin-top: 16px; }
.empty-desc { font-size: 14px; color: #A08D7A; margin-top: 8px; }

/* 日记列表 - 暖色 */
.diary-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.diary-card {
  cursor: pointer; position: relative; overflow: hidden; padding: 20px;
  transition: transform 0.35s, box-shadow 0.35s;
}
.diary-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
  background: linear-gradient(180deg, var(--amber), var(--terracotta));
}
.diary-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160, 120, 90, 0.16); }
.diary-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.diary-meta { display: flex; align-items: center; gap: 8px; }
.diary-avatar {
  width: 32px; height: 32px; border-radius: 10px;
  background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  color: #fff; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.diary-author { font-size: 13.5px; font-weight: 700; color: var(--text-deep); }
.diary-date { font-size: 12px; color: var(--text-secondary); }
.diary-tags { margin-left: auto; display: flex; gap: 6px; }
.diary-tag { font-size: 12px; padding: 3px 10px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); }
.diary-title { font-size: 17px; font-weight: 800; color: var(--terra-deep); margin-bottom: 8px; line-height: 1.4; }
.diary-preview {
  font-size: 13.5px; color: var(--text-secondary); line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.diary-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(226, 205, 178, 0.7);
  font-size: 12px; color: var(--text-secondary);
}
.pagination-wrap { display: flex; justify-content: center; padding: 16px 0 0; }

/* 查看弹窗 */
.diary-view-drawer :deep(.el-drawer__header) { padding: 20px 24px 16px; margin: 0; border-bottom: 1px solid #F3EADD; }
.diary-view-drawer :deep(.el-drawer__body) { padding: 24px; }
.view-header { width: 100%; }
.view-title { font-size: 20px; font-weight: 700; color: #6B5744; margin-bottom: 8px; }
.view-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #A08D7A; }
.view-date { margin-left: 4px; }
.view-tag { background: #F3EADD; padding: 2px 8px; border-radius: 6px; font-size: 12px; color: #A08D7A; }
.view-content { line-height: 1.8; color: #6B5744; }
.view-footer { display: flex; gap: 8px; }

/* ========== 编辑器全屏 ========== */
.editor-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: #fff; display: flex; flex-direction: column;
  animation: editorSlideIn 0.25s ease;
}
.editor-overlay.fullscreen { inset: 0; }

@keyframes editorSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 顶部栏 */
.editor-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-bottom: 1px solid #F3EADD;
  background: #fff; flex-shrink: 0;
}
.editor-topbar-left, .editor-topbar-right { display: flex; align-items: center; gap: 8px; }
.editor-topbar-title { font-size: 15px; font-weight: 600; color: #6B5744; }
.editor-btn {
  width: 36px; height: 36px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; display: flex;
  align-items: center; justify-content: center; color: #A08D7A;
  transition: all 0.2s;
}
.editor-btn:hover { background: #F3EADD; color: #6B5744; }
.editor-btn.active { background: #eff6ff; color: #C89F85; }

/* 标题和元信息 */
.editor-meta-bar { padding: 12px 16px 0; flex-shrink: 0; }
.editor-title-input {
  width: 100%; border: none; outline: none; font-size: 22px; font-weight: 700;
  color: #6B5744; padding: 8px 0; background: transparent;
}
.editor-title-input::placeholder { color: #E2CDB2; }
.editor-meta-fields { display: flex; gap: 12px; margin-top: 8px; }
.editor-meta-input {
  border: none; outline: none; font-size: 13px; color: #A08D7A;
  background: #FBF6EF; padding: 6px 12px; border-radius: 8px; width: 120px;
}
.editor-meta-input::placeholder { color: #E2CDB2; }

/* Markdown 工具栏 */
.editor-toolbar {
  display: flex; align-items: center; gap: 2px; padding: 8px 16px;
  border-bottom: 1px solid #F3EADD; flex-shrink: 0; flex-wrap: wrap;
}
.toolbar-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex;
  align-items: center; justify-content: center; color: #A08D7A;
  font-size: 13px; transition: all 0.15s;
}
.toolbar-btn:hover { background: #F3EADD; color: #6B5744; }
.toolbar-divider { width: 1px; height: 20px; background: rgba(226,205,178,.7); margin: 0 4px; }

/* 编辑区 */
.editor-body {
  flex: 1; display: flex; overflow: hidden; min-height: 0;
}
.editor-body.split-mode { gap: 1px; background: rgba(226,205,178,.7); }
.editor-body.split-mode .editor-pane,
.editor-body.split-mode .preview-pane { flex: 1; }

.editor-pane { flex: 1; display: flex; min-width: 0; }
.editor-textarea {
  flex: 1; width: 100%; border: none; outline: none; padding: 16px;
  font-size: 15px; line-height: 1.8; color: #6B5744; background: #fff;
  resize: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
}

.preview-pane {
  flex: 1; overflow-y: auto; background: #fafbfc; min-width: 0;
}
.preview-content { padding: 16px; }

/* 底部状态栏 */
.editor-statusbar {
  display: flex; gap: 16px; padding: 6px 16px;
  border-top: 1px solid #F3EADD; background: #FBF6EF; flex-shrink: 0;
}
.status-item { font-size: 12px; color: #A08D7A; }

/* Markdown 样式 */
.markdown-body :deep(h1) { font-size: 24px; font-weight: 700; margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #F3EADD; }
.markdown-body :deep(h2) { font-size: 20px; font-weight: 600; margin: 18px 0 10px; }
.markdown-body :deep(h3) { font-size: 17px; font-weight: 600; margin: 14px 0 8px; }
.markdown-body :deep(p) { margin: 10px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 24px; margin: 10px 0; }
.markdown-body :deep(li) { margin: 4px 0; }
.markdown-body :deep(blockquote) { border-left: 4px solid var(--terracotta); padding: 8px 16px; margin: 12px 0; background: rgba(102,126,234,0.04); color: #A08D7A; border-radius: 0 8px 8px 0; }
.markdown-body :deep(code) { background: #F3EADD; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #e11d48; }
.markdown-body :deep(pre) { background: #6B5744; color: rgba(226,205,178,.7); padding: 16px; border-radius: 10px; overflow-x: auto; margin: 12px 0; }
.markdown-body :deep(pre code) { background: none; color: inherit; padding: 0; }
.markdown-body :deep(strong) { font-weight: 700; color: #6B5744; }
.markdown-body :deep(em) { font-style: italic; }
.markdown-body :deep(hr) { border: none; border-top: 2px solid #F3EADD; margin: 20px 0; }
.markdown-body :deep(a) { color: var(--terracotta); text-decoration: none; }
.markdown-body :deep(a:hover) { text-decoration: underline; }
.markdown-body :deep(img) { max-width: 100%; border-radius: 8px; margin: 8px 0; }

/* 过渡动画 */
.editor-fade-enter-active, .editor-fade-leave-active { transition: opacity 0.2s ease; }
.editor-fade-enter-from, .editor-fade-leave-to { opacity: 0; }

/* 移动端适配 */
@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 12px; }
  .header-actions { width: 100%; flex-wrap: wrap; }
  .diary-list { grid-template-columns: 1fr; }
  .diary-card { padding: 16px; }
  .diary-title { font-size: 16px; }

  .editor-meta-fields { flex-wrap: wrap; }
  .editor-meta-input { width: 100%; }
  .editor-title-input { font-size: 18px; }

  .editor-toolbar { gap: 0; padding: 6px 8px; }
  .toolbar-btn { width: 36px; height: 36px; }

  .editor-body.split-mode { flex-direction: column; }
  .editor-body.split-mode .editor-pane,
  .editor-body.split-mode .preview-pane { flex: none; height: 50%; }

  .preview-content { padding: 12px; }
}
</style>

<template>
  <div class="moments-page">
    <!-- 顶部 -->
    <div class="moments-header">
      <div class="page-title" style="margin-bottom:0;">精彩瞬间</div>
      <el-button type="primary" @click="showPublish = true">
        <el-icon><EditPen /></el-icon>发布瞬间
      </el-button>
    </div>

    <!-- 发布弹窗 -->
    <el-dialog v-model="showPublish" title="发布瞬间" width="520px" :close-on-click-modal="false" destroy-on-close class="publish-dialog">
      <el-input
        v-model="publishForm.content"
        type="textarea"
        :rows="4"
        placeholder="记录这一刻的想法..."
        maxlength="1000"
        show-word-limit
      />
      <!-- 图片上传 -->
      <div class="publish-images">
        <div v-for="(img, idx) in publishForm.images" :key="idx" class="preview-img">
          <img :src="img" />
          <button class="remove-img" @click="publishForm.images.splice(idx, 1)">
            <el-icon><Close /></el-icon>
          </button>
        </div>
        <el-upload
          v-if="publishForm.images.length < 9"
          :http-request="handleUploadImage"
          :show-file-list="false"
          accept="image/*"
          class="upload-btn"
        >
          <div class="add-photo">
            <el-icon :size="24"><Plus /></el-icon>
          </div>
        </el-upload>
      </div>
      <!-- 地点和心情 -->
      <div class="publish-extras">
        <el-input v-model="publishForm.location" placeholder="📍 添加地点" style="flex:1;" clearable />
        <el-select v-model="publishForm.mood" placeholder="😊 心情" clearable style="width:120px;">
          <el-option label="😊 开心" value="开心" />
          <el-option label="🥰 幸福" value="幸福" />
          <el-option label="😎 自在" value="自在" />
          <el-option label="🤔 思考" value="思考" />
          <el-option label="😴 犯困" value="犯困" />
          <el-option label="🎉 庆祝" value="庆祝" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showPublish = false">取消</el-button>
        <el-button type="primary" :loading="publishing" @click="handlePublish">发布</el-button>
      </template>
    </el-dialog>

    <!-- 空状态 -->
    <div v-if="list.length === 0 && !loading" class="empty-card card">
      <el-icon :size="56" color="#cbd5e1"><Sunrise /></el-icon>
      <p class="empty-title">还没有精彩瞬间</p>
      <p class="empty-desc">记录家庭生活中的美好时刻</p>
      <el-button type="primary" @click="showPublish = true" style="margin-top:12px;">
        <el-icon><EditPen /></el-icon>发布第一条
      </el-button>
    </div>

    <!-- 时间轴列表 -->
    <div v-else class="timeline">
      <div v-for="(group, date) in grouped" :key="date" class="day-group">
        <div class="day-label">{{ formatDateLabel(date) }}</div>

        <div v-for="m in group" :key="m.id" class="moment-card card">
          <!-- 头部 -->
          <div class="moment-head">
            <el-avatar :size="40" :src="m.author?.avatar" class="moment-avatar">
              {{ (m.author?.nickname || '?')[0] }}
            </el-avatar>
            <div class="moment-user">
              <div class="moment-name">{{ m.author?.nickname || '未知' }}</div>
              <div class="moment-time">{{ formatTime(m.createdAt) }}</div>
            </div>
            <el-dropdown v-if="m.userId === authStore.user?.id" trigger="click" @command="(cmd) => cmd === 'delete' && handleDelete(m.id)">
              <el-icon class="more-btn"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 文字内容 -->
          <div v-if="m.content" class="moment-text">{{ m.content }}</div>

          <!-- 图片网格 -->
          <div v-if="m.images?.length" class="moment-images" :class="'grid-' + Math.min(m.images.length, 3)">
            <div v-for="(img, idx) in m.images" :key="idx" class="img-item" @click="previewImages(m.images, idx)">
              <img :src="img" />
            </div>
          </div>

          <!-- 地点和心情 -->
          <div v-if="m.location || m.mood" class="moment-meta">
            <span v-if="m.location" class="meta-item">📍 {{ m.location }}</span>
            <span v-if="m.mood" class="meta-item">😊 {{ m.mood }}</span>
          </div>

          <!-- 操作栏 -->
          <div class="moment-actions">
            <button class="action-btn" :class="{ liked: m._liked }" @click="handleLike(m)">
              <el-icon><StarFilled v-if="m._liked" /><Star v-else /></el-icon>
              <span>{{ m.likeCount > 0 ? m.likeCount : '点赞' }}</span>
            </button>
            <button class="action-btn" @click="toggleComment(m)">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ m.commentCount > 0 ? m.commentCount : '评论' }}</span>
            </button>
          </div>

          <!-- 评论区 -->
          <div v-if="m._showComments" class="comment-section">
            <div v-for="c in m.comments || []" :key="c.id" class="comment-item">
              <span class="comment-author">{{ c.author?.nickname || '未知' }}</span>
              <span class="comment-content">{{ c.content }}</span>
            </div>
            <div class="comment-input">
              <el-input
                v-model="m._newComment"
                size="small"
                placeholder="写评论..."
                @keyup.enter="submitComment(m)"
              >
                <template #append>
                  <el-button @click="submitComment(m)" :disabled="!m._newComment?.trim()">发送</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" style="text-align:center;padding:20px;">
        <el-button text :loading="loading" @click="loadMore">加载更多</el-button>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer v-if="previewVisible" :url-list="previewUrls" :initial-index="previewIdx" @close="previewVisible = false" />
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted } from 'vue'
import { momentApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Close, Plus, MoreFilled, Delete, Star, StarFilled, ChatDotRound, Sunrise } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = computed(() => list.value.length < total.value)

const showPublish = ref(false)
const publishing = ref(false)
const publishForm = ref({ content: '', images: [], location: '', mood: '' })

const previewVisible = ref(false)
const previewUrls = ref([])
const previewIdx = ref(0)

// 按日期分组
const grouped = computed(() => {
  const groups = {}
  for (const m of list.value) {
    const date = dayjs(m.createdAt).format('YYYY-MM-DD')
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  }
  return groups
})

function formatDateLabel(date) {
  const d = dayjs(date)
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  if (date === today) return '今天'
  if (date === yesterday) return '昨天'
  return d.format('M月D日 dddd')
}

function formatTime(t) {
  return dayjs(t).format('HH:mm')
}

function previewImages(images, idx) {
  previewUrls.value = images
  previewIdx.value = idx
  previewVisible.value = true
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadList()
})

async function loadList() {
  loading.value = true
  try {
    const res = await momentApi.getList({ familyId: authStore.currentFamily?.id, page: page.value, pageSize: pageSize.value })
    const items = res.data.list.map(m => ({ ...m, _liked: m.liked || false, _showComments: false, _newComment: '', comments: [] }))
    list.value.push(...items)
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadMore() {
  page.value++
  await loadList()
}

// 发布
async function handleUploadImage(params) {
  const formData = new FormData()
  formData.append('file', params.file)
  try {
    const res = await momentApi.uploadImage(formData)
    publishForm.value.images.push(res.data.url)
  } catch (e) { console.error(e) }
}

async function handlePublish() {
  if (!publishForm.value.content && publishForm.value.images.length === 0) {
    return ElMessage.warning('请输入文字或上传图片')
  }
  publishing.value = true
  try {
    await momentApi.create({
      ...publishForm.value,
      familyId: authStore.currentFamily?.id
    })
    ElMessage.success('发布成功')
    showPublish.value = false
    publishForm.value = { content: '', images: [], location: '', mood: '' }
    // 刷新列表
    list.value = []
    page.value = 1
    await loadList()
  } finally { publishing.value = false }
}

// 删除
async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除这条瞬间？', '确认', { type: 'warning' })
    await momentApi.remove(id)
    list.value = list.value.filter(m => m.id !== id)
    ElMessage.success('已删除')
  } catch { /* cancel */ }
}

// 点赞
async function handleLike(m) {
  if (m._liked) return
  const res = await momentApi.toggleLike(m.id)
  m._liked = res.data.liked
  m.likeCount = res.data.likeCount
}

// 评论
function toggleComment(m) {
  m._showComments = !m._showComments
  if (m._showComments && m.comments.length === 0) {
    loadComments(m)
  }
}

async function loadComments(m) {
  const res = await momentApi.getComments({ momentId: m.id })
  m.comments = res.data
}

async function submitComment(m) {
  const content = m._newComment?.trim()
  if (!content) return
  const res = await momentApi.addComment({ momentId: m.id, content })
  m.comments.push(res.data)
  m.commentCount++
  m._newComment = ''
}
</script>

<style scoped>
.moments-page {
  animation: pageIn 0.4s ease-out;
  max-width: 640px;
  margin: 0 auto;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.moments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 发布弹窗 */
.publish-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.preview-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-img {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.add-photo {
  width: 80px;
  height: 80px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}
.add-photo:hover {
  border-color: #667eea;
  color: #667eea;
}
.publish-extras {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* 空状态 */
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

/* 时间轴 */
.day-group {
  margin-bottom: 8px;
}
.day-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  padding: 12px 0 8px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 12px;
}

/* 瞬间卡片 */
.moment-card {
  padding: 16px;
  margin-bottom: 12px;
}
.moment-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.moment-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}
.moment-user {
  flex: 1;
  min-width: 0;
}
.moment-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.moment-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
.more-btn {
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}
.more-btn:hover {
  background: var(--border-light);
}

.moment-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 10px;
  word-break: break-word;
}

/* 图片网格 */
.moment-images {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}
.moment-images.grid-1 {
  grid-template-columns: 1fr;
  max-width: 300px;
}
.moment-images.grid-2 {
  grid-template-columns: 1fr 1fr;
  max-width: 400px;
}
.moment-images.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.img-item {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}
.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.img-item:hover img {
  transform: scale(1.05);
}

.moment-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}
.meta-item {
  font-size: 13px;
  color: var(--text-muted);
}

/* 操作栏 */
.moment-actions {
  display: flex;
  gap: 0;
  border-top: 1px solid var(--border-light);
  padding-top: 8px;
}
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.2s;
  border-radius: 6px;
}
.action-btn:hover {
  background: var(--border-light);
  color: var(--text-secondary);
}
.action-btn.liked {
  color: #f59e0b;
}

/* 评论区 */
.comment-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}
.comment-item {
  padding: 6px 0;
  font-size: 14px;
  line-height: 1.5;
}
.comment-author {
  font-weight: 600;
  color: #667eea;
  margin-right: 6px;
}
.comment-content {
  color: var(--text-primary);
}
.comment-input {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .moments-page {
    max-width: 100%;
  }
  .moment-images.grid-3 {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

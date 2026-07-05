<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <el-button text @click="router.push('/album')"><el-icon><ArrowLeft /></el-icon>返回</el-button>
        <div class="page-title" style="margin-bottom:0;">{{ album?.name || '相册详情' }}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <el-button @click="showShare = true"><el-icon><Share /></el-icon>分享</el-button>
        <el-upload :http-request="uploadPhoto" :show-file-list="false" accept="image/*">
          <el-button type="primary"><el-icon><Upload /></el-icon>上传照片</el-button>
        </el-upload>
      </div>
    </div>

    <!-- 加密验证 -->
    <div v-if="needsVerification && !verified" class="card" style="text-align:center;padding:40px;max-width:400px;margin:auto;">
      <el-icon :size="48" color="#E6A23C"><Lock /></el-icon>
      <p style="margin:12px 0;">此相册已加密，请输入密码</p>
      <el-input v-model="password" type="password" show-password placeholder="请输入相册密码" style="margin-bottom:12px;" @keyup.enter="verifyPassword" />
      <el-button type="primary" @click="verifyPassword" :loading="verifying">验证</el-button>
    </div>

    <div v-else-if="photos.length === 0" class="card" style="text-align:center;padding:60px;">
      <el-icon :size="48" color="#ddd"><PictureFilled /></el-icon>
      <p style="margin-top:12px;color:#999;">暂无照片，点击上方按钮上传</p>
    </div>

    <div v-else class="photo-grid">
      <div v-for="p in photos" :key="p.id" class="photo-item" @click="previewPhoto(p)">
        <img :src="p.thumbnailUrl || p.url" :alt="p.originalName" />
        <div class="photo-overlay">
          <div>{{ p.uploader?.nickname || '未知' }}</div>
        </div>
        <el-popconfirm title="确认删除这张照片？删除后不可恢复。" @confirm.stop="handleDeletePhoto(p.id)">
          <template #reference>
            <button class="photo-delete-btn" @click.stop title="删除照片">
              <el-icon :size="14"><Delete /></el-icon>
            </button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer v-if="previewVisible" :url-list="photos.map(p => p.url)" :initial-index="previewIndex" @close="previewVisible = false" />

    <!-- 分享弹窗 -->
    <el-dialog v-model="showShare" title="分享相册" width="400px">
      <div style="text-align:center;padding:20px 0;">
        <p style="margin-bottom:16px;color:#64748b;">将以下链接分享给家庭成员：</p>
        <el-input v-model="shareLink" readonly>
          <template #append>
            <el-button @click="copyLink">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { albumApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const album = ref(null)
const photos = ref([])
const previewVisible = ref(false)
const previewIndex = ref(0)
const password = ref('')
const verified = ref(false)
const needsVerification = ref(route.query.encrypted === '1')
const verifying = ref(false)
const showShare = ref(false)
const shareLink = ref(window.location.origin + '/album/' + route.params.id)

function copyLink() {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制')
}

onMounted(async () => {
  try {
    if (!authStore.currentFamily) {
      await authStore.getProfile()
    }
    const familyId = authStore.currentFamily?.id
    if (!familyId) return
    const albumsRes = await albumApi.getAlbums({ familyId })
    album.value = albumsRes.data.find(a => a.id == route.params.id)
    if (!needsVerification.value) loadPhotos()
  } catch (e) { console.error(e) }
})

async function verifyPassword() {
  verifying.value = true
  try {
    await albumApi.verifyAlbum(route.params.id, { password: password.value })
    verified.value = true
    needsVerification.value = false
    ElMessage.success('验证通过')
    loadPhotos()
  } catch { ElMessage.error('密码错误') }
  finally { verifying.value = false }
}

async function loadPhotos() {
  const res = await albumApi.getPhotos({ albumId: route.params.id, pageSize: 50 })
  photos.value = res.data.list
}

async function uploadPhoto(params) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('albumId', route.params.id)
  try {
    await albumApi.uploadPhoto(formData)
    ElMessage.success('上传成功')
    loadPhotos()
  } catch (e) { console.error(e) }
}

function previewPhoto(p) {
  previewIndex.value = photos.value.indexOf(p)
  previewVisible.value = true
}

async function handleDeletePhoto(id) {
  try {
    await albumApi.deletePhoto(id)
    ElMessage.success('已删除')
    photos.value = photos.value.filter(p => p.id !== id)
  } catch { /* handled by interceptor */ }
}
</script>

<style scoped>
.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  padding: 8px;
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}
.photo-item:hover .photo-overlay { opacity: 1; }

.photo-delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 2;
}
.photo-item:hover .photo-delete-btn {
  opacity: 1;
}
.photo-delete-btn:hover {
  background: rgba(248, 113, 113, 0.8);
  transform: scale(1.1);
}
</style>

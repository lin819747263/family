<template>
  <div class="albums-section">
    <div v-if="loading" class="card" style="text-align:center;padding:60px 20px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <div v-else-if="albums.length === 0" class="card" style="text-align:center;padding:60px 20px;">
      <span style="font-size:48px;">📷</span>
      <p style="margin-top:12px;color:var(--text-secondary);">还没有相册，创建一个开始记录家庭瞬间吧</p>
    </div>

    <div v-else class="albums-grid">
      <div v-for="a in albums" :key="a.id" class="card album-card" @click="handleAlbumClick(a)">
        <div class="al-cover">
          <div v-if="a.Photos?.length" class="al-photos">
            <div v-for="p in a.Photos.slice(0, 4)" :key="p.id" class="al-photo">
              <img :src="p.thumbnailUrl || p.url" />
            </div>
          </div>
          <div v-else class="al-empty"><span>📸</span></div>
          <span v-if="a.type === 'encrypted'" class="al-lock">🔒 加密</span>
        </div>
        <div class="al-body">
          <div class="al-name">{{ a.name }}</div>
          <div class="al-count">{{ a.photoCount || 0 }} 张照片</div>
        </div>
      </div>

      <div class="album-add" @click="showCreate = true">
        <span class="plus">＋</span>创建相册
      </div>
    </div>

    <!-- 加密相册密码验证弹窗 -->
    <el-dialog v-model="showPassword" title="🔒 加密相册" width="380px" destroy-on-close append-to-body class="warm-dialog">
      <div style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">请输入访问密码</div>
      <el-input v-model="verifyPassword" type="password" show-password placeholder="输入密码" @keyup.enter="handleVerify" />
      <template #footer>
        <el-button @click="showPassword = false">取消</el-button>
        <el-button type="primary" :loading="verifying" @click="handleVerify">确认</el-button>
      </template>
    </el-dialog>

    <!-- 创建相册弹窗 -->
    <el-dialog v-model="showCreate" title="创建相册" width="420px" destroy-on-close append-to-body class="warm-dialog">
      <el-form :model="form" label-width="80px" class="warm-form">
        <el-form-item label="相册名称"><el-input v-model="form.name" placeholder="如：2026春节、海边旅行" /></el-form-item>
        <el-form-item label="相册类型">
          <el-radio-group v-model="form.type">
            <el-radio value="normal">普通相册</el-radio>
            <el-radio value="encrypted">加密相册</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 'encrypted'" label="访问密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { albumApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const props = defineProps({ embedded: Boolean })
const router = useRouter()
const authStore = useAuthStore()
const albums = ref([])
const loading = ref(false)
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ name: '', type: 'normal', password: '', description: '' })
const showPassword = ref(false)
const verifyPassword = ref('')
const verifying = ref(false)
const pendingAlbum = ref(null)

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadAlbums()
})

async function loadAlbums() {
  loading.value = true
  try {
    const res = await albumApi.getAlbums({ familyId: authStore.currentFamily?.id })
    albums.value = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function handleAlbumClick(a) {
  if (a.type === 'encrypted') {
    pendingAlbum.value = a
    verifyPassword.value = ''
    showPassword.value = true
    return
  }
  router.push(`/album/${a.id}`)
}

async function handleVerify() {
  if (!verifyPassword.value) return ElMessage.warning('请输入密码')
  verifying.value = true
  try {
    await albumApi.verifyAlbum(pendingAlbum.value.id, { password: verifyPassword.value })
    showPassword.value = false
    router.push(`/album/${pendingAlbum.value.id}`)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '密码错误')
  } finally { verifying.value = false }
}

async function handleCreate() {
  if (!form.value.name) return ElMessage.warning('请输入相册名称')
  saving.value = true
  try {
    await albumApi.createAlbum({ ...form.value, familyId: authStore.currentFamily?.id })
    ElMessage.success('创建成功')
    showCreate.value = false
    form.value = { name: '', type: 'normal', password: '', description: '' }
    loadAlbums()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

defineExpose({ openCreate: () => { showCreate.value = true } })
</script>

<style scoped>
/* 相册网格 */
.albums-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
}
.album-card {
  padding: 0; overflow: hidden; cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
}
.album-card:hover {
  transform: translateY(-7px); box-shadow: 0 20px 44px rgba(160, 120, 90, 0.2);
}

/* 封面 */
.al-cover {
  height: 150px; position: relative; background: var(--apricot);
  display: flex; align-items: center; justify-content: center;
}
.al-photos {
  display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
  width: 100%; height: 100%; gap: 2px;
}
.al-photo { overflow: hidden; }
.al-photo img { width: 100%; height: 100%; object-fit: cover; }
.al-empty { font-size: 34px; opacity: 0.5; }
.al-lock {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  background: rgba(232, 179, 106, 0.92); color: #fff;
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
}

.al-body { padding: 13px 15px; }
.al-name { font-size: 15px; font-weight: 700; }
.al-count { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

/* 新建相册 */
.album-add {
  border: 2px dashed var(--wood-light); background: rgba(243, 234, 221, 0.4);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; min-height: 196px; color: var(--text-secondary);
  font-size: 14px; font-weight: 600; border-radius: 24px; cursor: pointer;
  transition: all 0.3s;
}
.album-add:hover {
  border-color: var(--terracotta); color: var(--terra-deep);
  background: rgba(243, 234, 221, 0.8); transform: translateY(-4px);
}
.album-add .plus { font-size: 32px; line-height: 1; }

@media (max-width: 960px) { .albums-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .albums-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
</style>

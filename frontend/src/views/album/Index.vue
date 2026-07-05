<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">我的相册</div>
      <div style="display:flex;gap:8px;">
        <el-button @click="router.push('/album/memories')"><el-icon><Star /></el-icon>回忆</el-button>
        <el-button type="primary" @click="showCreate = true"><el-icon><Plus /></el-icon>创建相册</el-button>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:60px 20px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <div v-else-if="albums.length === 0" class="card" style="text-align:center;padding:60px 20px;">
      <el-icon :size="48" color="#ddd"><PictureFilled /></el-icon>
      <p style="margin-top:12px;color:#999;">还没有相册，创建一个开始记录家庭瞬间吧</p>
    </div>

    <el-row :gutter="16">
      <el-col :xs="12" :sm="8" :md="6" v-for="a in albums" :key="a.id" style="margin-bottom:16px;">
        <div class="card" style="padding:0;overflow:hidden;cursor:pointer;" @click="handleAlbumClick(a)">
          <div style="height:160px;background:#f0f2f5;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
            <div v-if="a.Photos?.length" style="display:grid;grid-template-columns:1fr 1fr;width:100%;height:100%;">
              <img v-for="p in a.Photos.slice(0,4)" :key="p.id" :src="p.thumbnailUrl || p.url" style="width:100%;height:50%;object-fit:cover;" />
            </div>
            <el-icon v-else :size="40" color="#ccc"><PictureFilled /></el-icon>
            <div v-if="a.type === 'encrypted'" style="position:absolute;top:8px;right:8px;"><el-tag size="small" type="warning">加密</el-tag></div>
          </div>
          <div style="padding:12px;">
            <div style="font-weight:600;font-size:14px;">{{ a.name }}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">{{ a.photoCount || 0 }} 张照片</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreate" title="创建相册" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="相册名称"><el-input v-model="form.name" placeholder="如：2024春节" /></el-form-item>
        <el-form-item label="相册类型">
          <el-radio-group v-model="form.type">
            <el-radio value="normal">普通相册</el-radio>
            <el-radio value="encrypted">加密相册</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 'encrypted'" label="访问密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
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

const router = useRouter()
const authStore = useAuthStore()
const albums = ref([])
const loading = ref(false)
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ name: '', type: 'normal', password: '', description: '' })

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadAlbums()
})

async function loadAlbums() {
  if (!authStore.currentFamily) return
  loading.value = true
  try {
    const res = await albumApi.getAlbums({ familyId: authStore.currentFamily.id })
    albums.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function handleCreate() {
  if (!form.value.name) return ElMessage.warning('请输入相册名称')
  saving.value = true
  try {
    await albumApi.createAlbum({ ...form.value, familyId: authStore.currentFamily.id })
    ElMessage.success('创建成功')
    showCreate.value = false
    form.value = { name: '', type: 'normal', password: '', description: '' }
    loadAlbums()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleAlbumClick(a) {
  if (a.type === 'encrypted') {
    router.push({ path: `/album/${a.id}`, query: { encrypted: '1' } })
  } else {
    router.push(`/album/${a.id}`)
  }
}
</script>

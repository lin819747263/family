<template>
  <div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <el-button text @click="router.push('/album')"><el-icon><ArrowLeft /></el-icon>返回</el-button>
      <div class="page-title" style="margin-bottom:0;">回忆推送</div>
    </div>

    <!-- N年前的今天 -->
    <div v-if="memories.yearAgo?.length" class="card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <el-icon :size="20" color="#E6A23C"><Star /></el-icon>
        <span style="font-weight:600;font-size:16px;">去年今日</span>
      </div>
      <div class="photo-grid">
        <div v-for="p in memories.yearAgo" :key="p.id" class="photo-item" @click="router.push(`/album/${p.albumId}`)">
          <img :src="p.url || p.thumbnailUrl" />
        </div>
      </div>
    </div>

    <!-- 本周最佳 -->
    <div v-if="memories.weekBest?.length" class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <el-icon :size="20" color="#409EFF"><Camera /></el-icon>
        <span style="font-weight:600;font-size:16px;">本周最佳</span>
      </div>
      <div class="photo-grid">
        <div v-for="p in memories.weekBest" :key="p.id" class="photo-item" @click="router.push(`/album/${p.albumId}`)">
          <img :src="p.url || p.thumbnailUrl" />
        </div>
      </div>
    </div>

    <div v-if="!memories.yearAgo?.length && !memories.weekBest?.length" class="card" style="text-align:center;padding:60px;">
      <el-icon :size="48" color="#ddd"><Clock /></el-icon>
      <p style="margin-top:12px;color:#999;">暂无回忆内容，多上传照片就会在这里看到</p>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { albumApi } from '@/api'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()
const memories = ref({ yearAgo: [], weekBest: [] })

onMounted(async () => {
  if (!await useFamilyGuard()) return
  const res = await albumApi.getMemories({ familyId: authStore.currentFamily.id })
  memories.value = res.data
})
</script>

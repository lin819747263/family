<template>
  <div>
    <div v-if="!embedded" style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <el-button text @click="router.push('/album')"><el-icon><ArrowLeft /></el-icon>返回</el-button>
      <div class="page-title" style="margin-bottom:0;">回忆推送</div>
    </div>

    <!-- N年前的今天 -->
    <div v-if="memories.yearAgo?.length" class="mem-section">
      <div class="mem-head">
        <div class="mem-ico" style="background:linear-gradient(135deg,var(--amber),#C08A3E);">⭐</div>
        <div><div class="mem-title">去年今日</div><div class="mem-sub">{{ getYearAgoLabel() }}</div></div>
      </div>
      <div class="mem-grid">
        <div v-for="p in memories.yearAgo" :key="p.id" class="photo-item" @click="router.push(`/album/${p.albumId}`)">
          <img :src="p.url || p.thumbnailUrl" loading="lazy" />
          <span class="mem-year">{{ getPhotoYear(p) }}</span>
        </div>
      </div>
    </div>

    <!-- 本周最佳 -->
    <div v-if="memories.weekBest?.length" class="mem-section">
      <div class="mem-head">
        <div class="mem-ico" style="background:linear-gradient(135deg,var(--sky),#6E8CA0);">📸</div>
        <div><div class="mem-title">本周最佳</div><div class="mem-sub">家人点赞最多的 {{ memories.weekBest.length }} 张</div></div>
      </div>
      <div class="mem-grid">
        <div v-for="p in memories.weekBest" :key="p.id" class="photo-item" @click="router.push(`/album/${p.albumId}`)">
          <img :src="p.url || p.thumbnailUrl" loading="lazy" />
        </div>
      </div>
    </div>

    <div v-if="!memories.yearAgo?.length && !memories.weekBest?.length" class="card" style="text-align:center;padding:60px;">
      <span style="font-size:48px;">💫</span>
      <p style="margin-top:12px;color:var(--text-secondary);">暂无回忆内容，多上传照片就会在这里看到</p>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { albumApi } from '@/api'
import { useAuthStore } from '@/store/auth'

const props = defineProps({ embedded: Boolean })
const router = useRouter()
const authStore = useAuthStore()
const memories = ref({ yearAgo: [], weekBest: [] })

onMounted(async () => {
  if (!await useFamilyGuard()) return
  const res = await albumApi.getMemories({ familyId: authStore.currentFamily.id })
  memories.value = res.data
})
</script>

<script>
function getYearAgoLabel() {
  const y = new Date().getFullYear() - 1
  return `${y}年 · 一年前的今天`
}
function getPhotoYear(p) {
  if (p.createdAt) return new Date(p.createdAt).getFullYear()
  return new Date().getFullYear() - 1
}
</script>

<style scoped>
/* 回忆区块 */
.mem-section { margin-bottom: 26px; }
.mem-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.mem-ico {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #fff;
}
.mem-title { font-size: 18px; font-weight: 800; color: var(--terra-deep); }
.mem-sub { font-size: 12.5px; color: var(--text-secondary); }

/* 照片网格 */
.mem-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
}
.photo-item {
  height: 150px; border-radius: 16px; overflow: hidden; cursor: pointer;
  position: relative; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
}
.photo-item:hover {
  transform: translateY(-6px) rotate(-1deg); box-shadow: 0 16px 34px rgba(160, 120, 90, 0.22);
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.mem-year {
  position: absolute; left: 10px; bottom: 8px; z-index: 2;
  font-size: 11px; font-weight: 700; color: #fff;
  background: rgba(107, 87, 68, 0.5); backdrop-filter: blur(4px);
  padding: 2px 9px; border-radius: 999px;
}

@media (max-width: 960px) { .mem-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .mem-grid { grid-template-columns: repeat(2, 1fr); } }
</style>

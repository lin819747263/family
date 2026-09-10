<template>
  <div class="album-page">
    <!-- 页头 -->
    <div class="page-head">
      <div><div class="page-title">📷 点滴日常</div><div class="page-sub">把平凡日子，过成值得回味的故事</div></div>
      <button class="btn primary" @click="handleAction">✏️ {{ activeTab === 'moments' ? '发布瞬间' : activeTab === 'diary' ? '写日记' : '上传照片' }}</button>
    </div>

    <!-- 子页签 -->
    <div class="subtabs">
      <button class="subtab" :class="{ active: activeTab === 'albums' }" @click="switchTab('albums')">🗂 我的相册</button>
      <button class="subtab" :class="{ active: activeTab === 'moments' }" @click="switchTab('moments')">✨ 精彩瞬间</button>
      <button class="subtab" :class="{ active: activeTab === 'timeline' }" @click="switchTab('timeline')">⏳ 时光轴</button>
      <button class="subtab" :class="{ active: activeTab === 'memories' }" @click="switchTab('memories')">💫 回忆推送</button>
      <button class="subtab" :class="{ active: activeTab === 'diary' }" @click="switchTab('diary')">📔 家庭日记</button>
    </div>

    <!-- 内容区 -->
    <div v-if="activeTab === 'albums'"><AlbumsPage ref="albumsRef" embedded /></div>
    <div v-if="activeTab === 'moments'"><MomentsPage ref="momentsRef" embedded /></div>
    <div v-if="activeTab === 'timeline'"><TimelinePage embedded /></div>
    <div v-if="activeTab === 'memories'"><MemoriesPage embedded /></div>
    <div v-if="activeTab === 'diary'"><DiaryPage ref="diaryRef" embedded /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AlbumsPage from '@/views/album/Albums.vue'
import MomentsPage from '@/views/album/Moments.vue'
import TimelinePage from '@/views/album/Timeline.vue'
import MemoriesPage from '@/views/album/Memories.vue'
import DiaryPage from '@/views/diary/Index.vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref('albums')
const albumsRef = ref(null)
const momentsRef = ref(null)
const diaryRef = ref(null)

function switchTab(tab) {
  activeTab.value = tab
  router.replace(`/album${tab === 'albums' ? '' : '/' + tab}`)
}

function handleAction() {
  if (activeTab.value === 'moments') momentsRef.value?.openPublish?.()
  else if (activeTab.value === 'diary') diaryRef.value?.openCreate?.()
  else albumsRef.value?.openCreate?.()
}

// 根据路由初始化 tab
const path = route.path
if (path.includes('/moments')) activeTab.value = 'moments'
else if (path.includes('/timeline')) activeTab.value = 'timeline'
else if (path.includes('/memories')) activeTab.value = 'memories'
else if (path.includes('/diary')) activeTab.value = 'diary'
else activeTab.value = 'albums'
</script>

<style scoped>
.album-page { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* 页头 */
.page-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
}
.page-title { font-size: 26px; font-weight: 800; color: var(--terra-deep); }
.page-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-secondary); }
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 11px 18px; border-radius: 13px; border: none;
  cursor: pointer; font-size: 14px; font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}
.btn.primary {
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2; box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4);
}
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.3); }

/* 子页签 */
.subtabs {
  display: flex; gap: 6px;
  background: rgba(243, 234, 221, 0.6); border: 1px solid rgba(226, 205, 178, 0.7);
  padding: 5px; border-radius: 16px; margin-bottom: 22px; overflow-x: auto;
}
.subtab {
  padding: 10px 18px; border-radius: 12px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all 0.3s; display: flex; align-items: center; gap: 7px;
}
.subtab:hover { color: var(--terra-deep); }
.subtab.active {
  background: #FFFDFA; color: var(--terra-deep);
  box-shadow: 0 4px 14px rgba(160, 120, 90, 0.14);
}

@media (max-width: 600px) {
  .page-title { font-size: 22px; }
  .page-head { flex-direction: column; align-items: flex-start; }
}
</style>

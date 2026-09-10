<template>
  <div class="timeline-page">
    <div v-if="!embedded" class="page-header">
      <div>
        <div class="page-title">时光轴</div>
        <p class="page-desc">按时间回顾家庭照片</p>
      </div>
      <div class="header-actions">
        <el-select v-model="filterYear" placeholder="年份" clearable style="width:100px;" @change="onFilterChange">
          <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
        </el-select>
        <el-select v-model="filterMonth" placeholder="月份" clearable style="width:90px;" @change="onFilterChange">
          <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
        </el-select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <div v-else-if="groups.length === 0" class="empty-card card">
      <el-icon :size="56" color="var(--wood-light)"><PictureFilled /></el-icon>
      <p class="empty-title">暂无照片</p>
      <p class="empty-desc">去相册上传一些照片吧</p>
    </div>
    <div v-else>
      <div v-for="group in groups" :key="group.date" class="date-group">
        <div class="date-header">
          <div class="date-dot"></div>
          <div class="date-label">{{ formatDate(group.date) }}</div>
          <div class="date-count">{{ group.items.length }} 张</div>
        </div>
        <div class="photo-grid">
          <div v-for="p in group.items" :key="p.id" class="photo-item" @click="openPreview(p)">
            <img :src="p.thumbnailUrl || p.url" :alt="p.originalName" loading="lazy" />
          </div>
        </div>
      </div>

      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadTimeline"
        />
      </div>
    </div>

    <!-- 图片预览 -->
    <el-dialog v-model="showPreview" width="auto" class="preview-dialog warm-dialog" destroy-on-close>
      <img v-if="previewPhoto" :src="previewPhoto.url" class="preview-img" />
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { albumApi } from '@/api'
import { useAuthStore } from '@/store/auth'

const props = defineProps({ embedded: Boolean })
const authStore = useAuthStore()
const groups = ref([])
const years = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(50)
const total = ref(0)
const filterYear = ref(null)
const filterMonth = ref(null)

const showPreview = ref(false)
const previewPhoto = ref(null)

onMounted(async () => {
  await useFamilyGuard()
  loadTimeline()
})

async function loadTimeline() {
  if (!authStore.currentFamily) return
  loading.value = true
  try {
    const params = {
      familyId: authStore.currentFamily.id,
      page: page.value,
      pageSize: pageSize.value
    }
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    const res = await albumApi.getTimeline(params)
    groups.value = res.data.photos || []
    years.value = res.data.years || []
    total.value = res.data.total || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function onFilterChange() {
  page.value = 1
  loadTimeline()
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const week = weekDays[d.getDay()]
  return `${y}年${m}月${day}日 ${week}`
}

function openPreview(photo) {
  previewPhoto.value = photo
  showPreview.value = true
}
</script>

<style scoped>
.timeline-page {
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
  margin-bottom: 24px;
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
}

/* 加载和空状态 */
.loading-state {
  text-align: center;
  padding: 60px;
}

/* 时光轴 */
.date-group {
  position: relative; margin-bottom: 28px; padding-left: 26px;
}
.date-group::before {
  content: ""; position: absolute; left: 8px; top: 6px; bottom: 6px;
  width: 2px; background: linear-gradient(180deg, var(--terracotta), var(--amber), var(--sage));
  border-radius: 2px;
}
.date-group::after {
  content: ""; position: absolute; left: 3px; top: 6px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #FFFDFA; border: 3px solid var(--terracotta);
  box-shadow: 0 0 0 4px rgba(200, 159, 133, 0.18);
}
.date-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.date-label {
  font-size: 16px; font-weight: 800; color: var(--terra-deep);
}
.date-count {
  font-size: 11.5px; font-weight: 600; color: var(--text-secondary);
  background: var(--apricot); padding: 2px 10px; border-radius: 999px;
}

/* 照片网格 - 暖色 */
.photo-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.photo-item {
  height: 120px; border-radius: 12px; overflow: hidden; cursor: pointer;
  transition: transform 0.35s, box-shadow 0.35s;
}
.photo-item:hover {
  transform: scale(1.04); box-shadow: 0 12px 26px rgba(160, 120, 90, 0.2); z-index: 2;
}
.photo-item img {
  width: 100%; height: 100%; object-fit: cover;
}

/* 分页 */
.pagination-wrap {
  text-align: center;
  padding: 20px 0;
}

/* 预览 */
.preview-dialog.el-dialog {
  background: transparent;
  box-shadow: none;
  max-width: 90vw;
}
.preview-dialog.el-dialog .el-dialog__header {
  display: none;
}
.preview-dialog.el-dialog .el-dialog__body {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

<template>
  <div class="timeline-page">
    <div class="page-header">
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
      <el-icon :size="56" color="#cbd5e1"><PictureFilled /></el-icon>
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
    <el-dialog v-model="showPreview" width="auto" class="preview-dialog" destroy-on-close>
      <img v-if="previewPhoto" :src="previewPhoto.url" class="preview-img" />
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { albumApi } from '@/api'
import { useAuthStore } from '@/store/auth'

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

/* 日期分组 */
.date-group {
  margin-bottom: 32px;
}
.date-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-left: 6px;
}
.date-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  flex-shrink: 0;
}
.date-label {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
.date-count {
  font-size: 13px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 10px;
}

/* 照片网格 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}
.photo-item {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.photo-item:hover {
  transform: scale(1.05);
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 分页 */
.pagination-wrap {
  text-align: center;
  padding: 20px 0;
}

/* 预览 */
.preview-dialog :deep(.el-dialog) {
  background: transparent;
  box-shadow: none;
  max-width: 90vw;
}
.preview-dialog :deep(.el-dialog__header) {
  display: none;
}
.preview-dialog :deep(.el-dialog__body) {
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

<template>
  <el-drawer
    :model-value="visible"
    title="消息通知"
    size="380px"
    class="notification-drawer"
    @update:model-value="$emit('close')"
  >
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
        <span style="font-size:17px;font-weight:600;color:#1e293b;">消息通知</span>
        <el-button
          v-if="unreadCount > 0"
          text
          type="primary"
          size="small"
          @click="$emit('mark-all-read')"
        >全部已读</el-button>
      </div>
    </template>
    <div v-if="notifications.length === 0" class="empty-notice">
      <el-icon :size="48" color="#cbd5e1"><Bell /></el-icon>
      <p>暂无新通知</p>
    </div>
    <div
      v-for="n in notifications"
      :key="n.id"
      class="notice-card"
      :class="{ 'notice-read': n.isRead }"
      @click="$emit('mark-read', n)"
    >
      <div class="notice-title">{{ n.title }}</div>
      <div class="notice-content">{{ n.content }}</div>
      <div class="notice-time">{{ dayjs(n.createdAt).format('MM-DD HH:mm') }}</div>
    </div>
  </el-drawer>
</template>

<script setup>
import dayjs from 'dayjs'
import { Bell } from '@element-plus/icons-vue'

defineProps({
  visible: Boolean,
  notifications: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 }
})

defineEmits(['close', 'mark-read', 'mark-all-read'])
</script>

<style scoped>
.notification-drawer :deep(.el-drawer__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-light);
}
.notification-drawer :deep(.el-drawer__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-notice {
  text-align: center;
  padding: 60px 20px;
}
.empty-notice p {
  margin-top: 12px;
  color: #94a3b8;
  font-size: 14px;
}

.notice-card {
  padding: 14px 16px;
  margin: 0 8px 8px;
  background: var(--bg-page);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  transition: all 0.2s;
  cursor: pointer;
}
.notice-card:hover {
  background: var(--border-light);
}
.notice-card.notice-read {
  opacity: 0.6;
}
.notice-card.notice-read:hover {
  opacity: 0.8;
}
.notice-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.notice-content {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
.notice-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}
</style>

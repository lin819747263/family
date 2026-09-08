<template>
  <el-drawer
    :model-value="visible"
    direction="ltr"
    size="260px"
    :show-close="false"
    class="mobile-menu-drawer"
    @update:model-value="$emit('close')"
  >
    <template #header>
      <div class="mobile-drawer-header">
        <div class="logo-mark" style="width:32px;height:32px;border-radius:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span style="font-size:16px;font-weight:700;color:var(--terra-deep,#96684A);">家庭管家</span>
      </div>
    </template>
    <el-menu
      :default-active="activeMenu"
      router
      background-color="transparent"
      text-color="#A08D7A"
      active-text-color="#96684A"
      @select="$emit('close')"
    >
      <el-menu-item index="/">
        <el-icon><DataBoard /></el-icon>
        <span>首页</span>
      </el-menu-item>

      <el-menu-item index="/accounting">
        <el-icon><Coin /></el-icon>
        <span>小家账本</span>
      </el-menu-item>

      <el-menu-item index="/reminder">
        <el-icon><Bell /></el-icon>
        <span>家庭提醒</span>
      </el-menu-item>

      <el-menu-item index="/album">
        <el-icon><PictureFilled /></el-icon>
        <span>点滴日常</span>
      </el-menu-item>

      <el-menu-item index="/inventory">
        <el-icon><Box /></el-icon>
        <span>物品管理</span>
      </el-menu-item>

      <el-menu-item index="/fun">
        <el-icon><Food /></el-icon>
        <span>吃喝玩乐</span>
      </el-menu-item>

      <el-menu-item index="/member">
        <el-icon><User /></el-icon>
        <span>档案</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup>
import {
  DataBoard, Coin, PictureFilled, Box, Bell, Aim, Food, Notebook, User
} from '@element-plus/icons-vue'

defineProps({
  visible: Boolean,
  activeMenu: { type: String, default: '/' }
})

defineEmits(['close'])
</script>

<style scoped>
.mobile-drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #C89F85, #D9B697);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-drawer :deep(.el-drawer__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
}
.mobile-menu-drawer :deep(.el-drawer__body) {
  padding: 8px 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.mobile-menu-drawer :deep(.el-menu) {
  border-right: none;
}
.mobile-menu-drawer :deep(.el-menu-item),
.mobile-menu-drawer :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  font-size: 15px;
  border-radius: 0;
  margin: 0;
  padding: 0 20px;
}
.mobile-menu-drawer :deep(.el-menu-item:active),
.mobile-menu-drawer :deep(.el-sub-menu__title:active) {
  background: rgba(200, 159, 133, 0.08) !important;
}
.mobile-menu-drawer :deep(.el-menu-item.is-active) {
  background: rgba(200, 159, 133, 0.12) !important;
  color: #96684A !important;
  font-weight: 600;
}
.mobile-menu-drawer :deep(.el-sub-menu .el-menu-item) {
  height: 44px;
  line-height: 44px;
  padding-left: 48px !important;
  font-size: 14px;
}
.mobile-menu-drawer :deep(.el-sub-menu .el-menu) {
  background: rgba(243, 234, 221, 0.3) !important;
}
</style>

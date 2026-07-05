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
        <span style="font-size:16px;font-weight:700;color:#1e293b;">家庭管家</span>
      </div>
    </template>
    <el-menu
      :default-active="activeMenu"
      router
      background-color="transparent"
      text-color="#475569"
      active-text-color="#667eea"
      @select="$emit('close')"
    >
      <el-menu-item index="/">
        <el-icon><DataBoard /></el-icon>
        <span>首页</span>
      </el-menu-item>

      <el-sub-menu index="accounting">
        <template #title>
          <el-icon><Coin /></el-icon>
          <span>智能记账</span>
        </template>
        <el-menu-item index="/accounting">流水账单</el-menu-item>
        <el-menu-item index="/accounting/books">账本管理</el-menu-item>
        <el-menu-item index="/accounting/budgets">预算管理</el-menu-item>
        <el-menu-item index="/accounting/report">报表分析</el-menu-item>
        <el-menu-item index="/accounting/annual-report">年度报告</el-menu-item>
        <el-menu-item index="/accounting/recurring">定时记账</el-menu-item>
        <el-menu-item index="/accounting/categories">分类管理</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="album">
        <template #title>
          <el-icon><PictureFilled /></el-icon>
          <span>家庭相册</span>
        </template>
        <el-menu-item index="/album">我的相册</el-menu-item>
        <el-menu-item index="/album/moments">精彩瞬间</el-menu-item>
        <el-menu-item index="/album/timeline">时光轴</el-menu-item>
        <el-menu-item index="/album/memories">回忆推送</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="inventory">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>物品管理</span>
        </template>
        <el-menu-item index="/inventory">物品总览</el-menu-item>
        <el-menu-item index="/inventory/spaces">空间管理</el-menu-item>
        <el-menu-item index="/inventory/borrows">借物追踪</el-menu-item>
        <el-menu-item index="/inventory/unused">断舍离助手</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="reminder">
        <template #title>
          <el-icon><Bell /></el-icon>
          <span>家庭提醒</span>
        </template>
        <el-menu-item index="/calendar">日历视图</el-menu-item>
        <el-menu-item index="/anniversary">纪念日</el-menu-item>
        <el-menu-item index="/todo">待办清单</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="other">
        <template #title>
          <el-icon><MoreFilled /></el-icon>
          <span>其他</span>
        </template>
        <el-menu-item index="/investment">💰 理财管理</el-menu-item>
        <el-menu-item index="/recipe">菜谱管理</el-menu-item>
        <el-menu-item index="/member">成员档案</el-menu-item>
        <el-menu-item index="/wishlist">家庭心愿</el-menu-item>
        <el-menu-item index="/diary">家庭日记</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-drawer>
</template>

<script setup>
import {
  DataBoard, Coin, PictureFilled, Box, Bell, MoreFilled
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-drawer :deep(.el-drawer__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}
.mobile-menu-drawer :deep(.el-drawer__body) {
  padding: 8px 0;
}
.mobile-menu-drawer :deep(.el-menu) {
  border-right: none;
}
.mobile-menu-drawer :deep(.el-menu-item),
.mobile-menu-drawer :deep(.el-sub-menu__title) {
  height: 46px;
  line-height: 46px;
  font-size: 14px;
  border-radius: 0;
  margin: 0;
  padding: 0 20px;
}
.mobile-menu-drawer :deep(.el-menu-item.is-active) {
  background: rgba(102, 126, 234, 0.08) !important;
  color: #667eea !important;
  font-weight: 600;
}
.mobile-menu-drawer :deep(.el-sub-menu .el-menu-item) {
  height: 42px;
  line-height: 42px;
  padding-left: 48px !important;
  font-size: 13px;
}
</style>

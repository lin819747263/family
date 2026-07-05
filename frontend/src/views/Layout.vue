<template>
  <div class="app-container" :class="{ dark: appStore.darkMode }">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-inner">
        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="showMobileMenu = true">
          <el-icon :size="22"><Expand /></el-icon>
        </button>

        <!-- Logo -->
        <div class="nav-logo" @click="router.push('/')">
          <div class="logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="logo-text">家庭管家</span>
        </div>

        <!-- 桌面端导航菜单 -->
        <nav class="nav-menu desktop-menu">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            :ellipsis="false"
            background-color="transparent"
            text-color="#475569"
            active-text-color="#667eea"
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
        </nav>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 账本切换 -->
          <el-popover
            v-if="showBookSelector && accountingStore.books.length"
            placement="bottom-end"
            :width="200"
            trigger="click"
          >
            <template #reference>
              <button class="action-btn">
                <el-icon :size="18"><Notebook /></el-icon>
              </button>
            </template>
            <div class="book-popover-title">切换账本</div>
            <div
              v-for="b in accountingStore.books"
              :key="b.id"
              class="book-popover-item"
              :class="{ active: b.id === accountingStore.currentBookId }"
              @click="accountingStore.setCurrentBookId(b.id)"
            >
              <el-icon class="book-item-check" v-if="b.id === accountingStore.currentBookId"><Check /></el-icon>
              <span class="book-item-name">{{ b.name }}</span>
              <el-tag :type="b.type === 'family' ? 'primary' : 'success'" size="small" effect="plain">{{ b.type === 'family' ? '家庭' : '个人' }}</el-tag>
            </div>
          </el-popover>

          <!-- 全局搜索 -->
          <el-tooltip content="搜索 (Ctrl+K)" placement="bottom">
            <button class="action-btn search-trigger" @click="showSearch = true">
              <el-icon :size="18"><Search /></el-icon>
            </button>
          </el-tooltip>

          <!-- AI 助手 -->
          <el-tooltip content="AI 小助手" placement="bottom">
            <button class="action-btn ai-btn" @click="showAI = true">
              <span style="font-size:18px;">🤖</span>
            </button>
          </el-tooltip>

          <!-- 通知 -->
          <el-badge :is-dot="unreadCount > 0" class="action-badge">
            <button class="action-btn" @click="showNotifications = true">
              <el-icon :size="20"><Bell /></el-icon>
            </button>
          </el-badge>

          <!-- 暗黑模式 -->
          <button class="action-btn" @click="appStore.toggleDarkMode">
            <el-icon :size="18">
              <Moon v-if="!appStore.darkMode" />
              <Sunny v-else />
            </el-icon>
          </button>

          <!-- 用户头像 -->
          <el-dropdown trigger="click" @command="handleUserCmd">
            <div class="user-avatar-wrap">
              <el-avatar :size="34" :src="authStore.user?.avatar" class="user-avatar">
                {{ authStore.nickname[0] }}
              </el-avatar>
              <span class="user-name">{{ authStore.nickname }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="canInstall" command="install">
                  <el-icon><Download /></el-icon>安装应用
                </el-dropdown-item>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="family">
                  <el-icon><UserFilled /></el-icon>家庭管理
                </el-dropdown-item>
                <el-dropdown-item v-if="authStore.user?.role === 'admin'" command="admin">
                  <el-icon><Setting /></el-icon>后台管理
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="page-main">
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 快捷记账浮动按钮（仅记账相关页面显示） -->
    <button v-if="isAccountingPage" class="fab-btn" @click="showQuickAdd = true" title="快速记账">
      <el-icon :size="24"><Plus /></el-icon>
    </button>

    <!-- 快捷记账弹窗 -->
    <el-dialog
      v-model="showQuickAdd"
      :width="quickAddMode === 'batch' ? '520px' : '440px'"
      top="10vh"
      :close-on-click-modal="false"
      :lock-scroll="false"
      append-to-body
      class="quick-add-dialog"
    >
      <template #header>
        <div class="quick-add-header">
          <span class="quick-add-title">快速记账</span>
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: quickAddMode === 'single' }" @click="quickAddMode = 'single'">
              <el-icon><EditPen /></el-icon>单笔
            </button>
            <button class="mode-btn" :class="{ active: quickAddMode === 'batch' }" @click="quickAddMode = 'batch'">
              <el-icon><Document /></el-icon>批量
            </button>
          </div>
        </div>
      </template>
      <TransactionForm v-if="quickAddMode === 'single'" @success="showQuickAdd = false" />
      <BatchTransactionForm v-else @success="showQuickAdd = false" />
    </el-dialog>

    <!-- 移动端侧栏菜单 -->
    <el-drawer
      v-model="showMobileMenu"
      direction="ltr"
      size="260px"
      :show-close="false"
      class="mobile-menu-drawer"
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
        @select="showMobileMenu = false"
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

    <!-- 通知面板 -->
    <el-drawer
      v-model="showNotifications"
      title="消息通知"
      size="380px"
      class="notification-drawer"
    >
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
          <span style="font-size:17px;font-weight:600;color:#1e293b;">消息通知</span>
          <el-button
            v-if="unreadCount > 0"
            text
            type="primary"
            size="small"
            @click="handleMarkAllRead"
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
        @click="handleMarkRead(n)"
      >
        <div class="notice-title">{{ n.title }}</div>
        <div class="notice-content">{{ n.content }}</div>
        <div class="notice-time">{{ dayjs(n.createdAt).format('MM-DD HH:mm') }}</div>
      </div>
    </el-drawer>

    <!-- AI 助手 -->
    <ChatPanel :visible="showAI" @close="showAI = false" />

    <!-- 全局搜索 -->
    <GlobalSearch :visible="showSearch" @close="showSearch = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useAppStore } from '@/store/app'
import { useAccountingStore } from '@/store/accounting'
import { dashboardApi } from '@/api'
import TransactionForm from '@/components/accounting/TransactionForm.vue'
import BatchTransactionForm from '@/components/accounting/BatchTransactionForm.vue'
import ChatPanel from '@/views/ai/ChatPanel.vue'
import GlobalSearch from '@/components/search/GlobalSearch.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const accountingStore = useAccountingStore()

const showBookSelector = computed(() => {
  const path = route.path
  return path === '/' || path.startsWith('/accounting')
})

const isAccountingPage = computed(() => {
  const path = route.path
  return path === '/' || path.startsWith('/accounting')
})

const showQuickAdd = ref(false)
const quickAddMode = ref('single') // 'single' | 'batch'
const showMobileMenu = ref(false)
const showNotifications = ref(false)
const showAI = ref(false)
const showSearch = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// PWA 安装
const canInstall = ref(false)
let deferredPrompt = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })
  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    deferredPrompt = null
  })
})

async function installPWA() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    canInstall.value = false
  }
  deferredPrompt = null
}

const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  // 匹配一级路径
  const match = path.match(/^\/[^/]+/)
  return match ? match[0] : '/'
})

onMounted(async () => {
  if (authStore.isLoggedIn) {
    await authStore.getProfile()
    loadNotifications()
    if (showBookSelector.value) {
      accountingStore.loadBooks(authStore.currentFamily?.id)
    }
  }
})

// 进入首页或记账路由时加载账本列表
watch(showBookSelector, (val) => {
  if (val && accountingStore.books.length === 0) {
    accountingStore.loadBooks(authStore.currentFamily?.id)
  }
})

// 家庭切换时重新加载账本
watch(() => authStore.currentFamily, (family) => {
  if (family) {
    accountingStore.loadBooks(family.id)
  }
})

async function loadNotifications() {
  if (!authStore.currentFamily) return
  try {
    const res = await dashboardApi.getData({ familyId: authStore.currentFamily.id })
    notifications.value = res.data.notifications || []
    unreadCount.value = res.data.notifications?.filter(n => !n.isRead).length || 0
  } catch (e) { console.error(e) }
}

async function handleMarkRead(n) {
  if (n.isRead) return
  await dashboardApi.markRead(n.id)
  n.isRead = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function handleMarkAllRead() {
  await dashboardApi.markAllRead()
  notifications.value.forEach(n => { n.isRead = true })
  unreadCount.value = 0
}

function handleUserCmd(cmd) {
  if (cmd === 'install') installPWA()
  else if (cmd === 'profile') router.push('/profile')
  else if (cmd === 'family') router.push('/family')
  else if (cmd === 'admin') router.push('/admin')
  else if (cmd === 'logout') authStore.logout()
}
</script>

<style scoped>
/* ========== 顶部导航 ========== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 60px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

.nav-inner {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-right: 12px;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.nav-logo:hover { opacity: 0.8; }

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  min-width: 0;
}

.nav-menu :deep(.el-menu) {
  border-bottom: none;
  height: 60px;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item),
.nav-menu :deep(.el-menu--horizontal > .el-sub-menu) {
  height: 60px;
  line-height: 60px;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: none !important;
  transition: all 0.25s;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(102, 126, 234, 0.06) !important;
  color: #667eea !important;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #667eea !important;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.08) !important;
  position: relative;
}
.nav-menu :deep(.el-menu-item.is-active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 2.5px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px 2px 0 0;
}

.nav-menu :deep(.el-sub-menu .el-menu-item) {
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  min-width: 120px;
  border-radius: 8px;
  margin: 2px 8px;
  padding: 0 16px;
}

.nav-menu :deep(.el-sub-menu .el-menu-item:hover) {
  background: rgba(102, 126, 234, 0.06) !important;
  color: #667eea !important;
}

.nav-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: rgba(102, 126, 234, 0.1) !important;
  color: #667eea !important;
}

.nav-menu :deep(.el-sub-menu .el-menu) {
  border-radius: 12px;
  padding: 6px 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.nav-menu :deep(.el-icon) {
  margin-right: 4px;
}

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-badge :deep(.el-badge__content.is-dot) {
  width: 8px;
  height: 8px;
  right: 6px;
  top: 6px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
}
.action-btn:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

/* 账本切换弹出框 */
.book-popover-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 0 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 6px;
}
.book-popover-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #475569;
}
.book-popover-item:hover {
  background: rgba(102, 126, 234, 0.06);
}
.book-popover-item.active {
  color: #667eea;
  font-weight: 600;
}
.book-item-check {
  color: #667eea;
  font-size: 14px;
  flex-shrink: 0;
}
.book-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
  border-radius: 12px;
  transition: background 0.25s;
}
.user-avatar-wrap:hover {
  background: rgba(102, 126, 234, 0.06);
}

.user-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  color: #94a3b8;
  font-size: 12px;
}

/* ========== 主内容 ========== */
.page-main {
  padding-top: 60px;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #f5f7fa 100%);
}

.page-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;
}

/* ========== 浮动按钮 ========== */
.fab-btn {
  position: fixed;
  bottom: 36px;
  right: 36px;
  z-index: 99;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}
.fab-btn:hover {
  transform: translateY(-3px) rotate(90deg);
  box-shadow: 0 10px 32px rgba(102, 126, 234, 0.45);
}
.fab-btn:active {
  transform: translateY(0) rotate(90deg);
}

/* ========== 弹窗美化 ========== */
.quick-add-dialog :deep(.el-overlay) { transition: none !important; }
.quick-add-dialog :deep(.el-dialog) {
  transition: none !important;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}
.quick-add-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-light);
}
.quick-add-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 记账模式切换 */
.quick-add-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.quick-add-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
.mode-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-btn.active {
  background: #fff;
  color: #667eea;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.mode-btn:hover:not(.active) {
  color: #64748b;
}
.quick-add-dialog :deep(.el-dialog__body) {
  padding: 20px 24px 24px;
}

/* ========== 通知面板 ========== */
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

/* ========== 过渡动画 ========== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ========== 移动端菜单按钮 ========== */
.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s;
}
.mobile-menu-btn:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 移动端侧栏菜单样式 */
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

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .nav-inner {
    padding: 0 12px;
  }
  .mobile-menu-btn {
    display: flex;
  }
  .desktop-menu {
    display: none;
  }
  .logo-text {
    display: none;
  }
  .user-name {
    display: none;
  }
  .user-arrow {
    display: none;
  }
  .page-content {
    padding: 12px;
  }
  .fab-btn {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 14px;
  }

  /* 快速记账弹窗 - 底部弹出式 */
  .quick-add-dialog :deep(.el-overlay) {
    align-items: flex-end;
  }
  .quick-add-dialog :deep(.el-dialog) {
    width: 100vw !important;
    max-width: 100vw;
    margin: 0 !important;
    border-radius: 20px 20px 0 0;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  .quick-add-dialog :deep(.el-dialog__header) {
    padding: 12px 16px 10px;
    margin: 0;
    flex-shrink: 0;
  }
  .quick-add-dialog :deep(.el-dialog__headerbtn) {
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
  }
  .quick-add-dialog :deep(.el-dialog__body) {
    padding: 0 16px 24px;
    overflow-y: auto;
    flex: 1;
    -webkit-overflow-scrolling: touch;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
  .quick-add-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  .mode-toggle {
    padding: 2px;
  }
  .mode-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
  /* 拖拽指示条 */
  .quick-add-dialog :deep(.el-dialog__header)::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 0 auto 10px;
  }

  /* 通知面板适配移动端 */
  .notification-drawer :deep(.el-drawer) {
    width: 85vw !important;
  }
}
</style>

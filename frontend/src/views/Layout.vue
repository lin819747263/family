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
            background-color="transparent"
            text-color="#A08D7A"
            active-text-color="#96684A"
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

    <!-- 快速记账卡片 -->
    <div class="qa-card" :class="{ open: showQuickAdd }">
      <div class="qa-head">
        <div class="qa-title">✏️ 快速记账</div>
        <div class="mode-toggle">
          <button class="mode-btn" :class="{ active: quickAddMode === 'single' }" @click="quickAddMode = 'single'">单笔</button>
          <button class="mode-btn" :class="{ active: quickAddMode === 'batch' }" @click="quickAddMode = 'batch'">批量</button>
        </div>
        <button class="qa-close" @click="showQuickAdd = false">✕</button>
      </div>
      <div class="qa-body">
        <TransactionForm v-if="quickAddMode === 'single'" @success="onQuickAddSuccess" />
        <BatchTransactionForm v-else @success="onQuickAddSuccess" />
      </div>
    </div>

    <!-- 快捷记账浮动按钮（仅记账相关页面显示） -->
    <button v-if="isAccountingPage" class="fab-btn" :class="{ open: showQuickAdd }" @click="showQuickAdd = !showQuickAdd" title="快速记账">
      <span class="fab-plus">＋</span>
    </button>

    <!-- 移动端侧栏菜单 -->
    <MobileMenu :visible="showMobileMenu" :active-menu="activeMenu" @close="showMobileMenu = false" />

    <!-- 通知面板 -->
    <NotificationPanel
      :visible="showNotifications"
      :notifications="notifications"
      :unread-count="unreadCount"
      @close="showNotifications = false"
      @mark-read="handleMarkRead"
      @mark-all-read="handleMarkAllRead"
    />

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
import MobileMenu from '@/components/common/MobileMenu.vue'
import NotificationPanel from '@/components/common/NotificationPanel.vue'
import {
  DataBoard, Coin, PictureFilled, Box, Bell, Expand, Aim, Food,
  Search, Moon, Sunny, ArrowDown, Download, User, UserFilled,
  Setting, SwitchButton, Notebook, Check, Plus, EditPen, Document
} from '@element-plus/icons-vue'

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
const quickAddMode = ref('single')
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
  // Escape 关闭快速记账卡片
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') showQuickAdd.value = false
  })
})

async function installPWA() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') canInstall.value = false
  deferredPrompt = null
}

const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return '/'
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

watch(showBookSelector, (val) => {
  if (val && accountingStore.books.length === 0) {
    accountingStore.loadBooks(authStore.currentFamily?.id)
  }
})

watch(() => authStore.currentFamily, (family) => {
  if (family) accountingStore.loadBooks(family.id)
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

function onQuickAddSuccess() {
  showQuickAdd.value = false
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
  height: 64px;
  background: rgba(255, 252, 247, 0.82);
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 20px rgba(160, 120, 90, 0.06);
}

.nav-inner {
  max-width: 1240px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.nav-logo:hover { opacity: 0.8; }

.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--terracotta), #D9B697);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 14px rgba(200, 159, 133, 0.4);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-logo:hover .logo-mark {
  transform: rotate(-8deg) scale(1.06);
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--terra-deep);
  letter-spacing: 0.06em;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  min-width: 0;
}

.nav-menu :deep(.el-menu) {
  border-bottom: none;
  height: 64px;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item),
.nav-menu :deep(.el-menu--horizontal > .el-sub-menu) {
  height: 64px;
  line-height: 64px;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: none !important;
  transition: all 0.25s;
  padding: 0 8px;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(200, 159, 133, 0.1) !important;
  color: var(--terra-deep) !important;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: var(--terra-deep) !important;
  font-weight: 600;
  background: rgba(200, 159, 133, 0.12) !important;
  position: relative;
}
.nav-menu :deep(.el-menu-item.is-active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 2.5px;
  background: linear-gradient(90deg, var(--terracotta), var(--amber));
  border-radius: 2px 2px 0 0;
  animation: navGrow 0.35s ease;
}
@keyframes navGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

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
  background: rgba(200, 159, 133, 0.08) !important;
  color: var(--terra-deep) !important;
}

.nav-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: rgba(200, 159, 133, 0.12) !important;
  color: var(--terra-deep) !important;
}

.nav-menu :deep(.el-sub-menu .el-menu) {
  border-radius: 12px;
  padding: 6px 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.nav-menu :deep(.el-icon) {
  margin-right: 3px;
}

/* 确保菜单不溢出 */
.nav-menu :deep(.el-menu--horizontal) {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
}

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 4px;
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
  background: rgba(200, 159, 133, 0.12);
  color: var(--terra-deep);
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
  background: rgba(200, 159, 133, 0.08);
}
.book-popover-item.active {
  color: var(--terra-deep);
  font-weight: 600;
}
.book-item-check {
  color: var(--terracotta);
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
  background: rgba(200, 159, 133, 0.1);
}

.user-avatar {
  background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(176, 132, 102, 0.3);
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
  padding-top: 64px;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--warm-white) 0%, var(--cream) 55%, #F0E2D0 100%);
}

.page-content {
  max-width: 1240px;
  margin: 0 auto;
  padding: 26px 22px 80px;
}

/* ========== 浮动按钮 ========== */
.fab-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 80;
  width: 60px;
  height: 60px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, var(--terracotta), var(--terra-deep));
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px rgba(176, 132, 102, 0.45);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
}
.fab-btn::after {
  content: ""; position: absolute; inset: 0; border-radius: 20px;
  box-shadow: 0 0 0 0 rgba(200, 159, 133, 0.5);
  animation: fab-ring 2.8s ease-out infinite;
}
@keyframes fab-ring {
  0% { box-shadow: 0 0 0 0 rgba(200, 159, 133, 0.45); }
  70% { box-shadow: 0 0 0 18px rgba(200, 159, 133, 0); }
  100% { box-shadow: 0 0 0 0 rgba(200, 159, 133, 0); }
}
.fab-plus {
  font-size: 28px; line-height: 1;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-btn.open .fab-plus { transform: rotate(135deg); }
.fab-btn:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(176, 132, 102, 0.55); }

/* ========== 快速记账卡片 ========== */
.qa-card {
  position: fixed; right: 32px; bottom: 104px; z-index: 79;
  width: 380px; max-height: min(72vh, 640px);
  background: #FFFDFA; border: 1px solid rgba(226, 205, 178, 0.7);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(150, 104, 74, 0.28);
  display: flex; flex-direction: column; overflow: hidden;
  transform-origin: bottom right;
  transform: scale(0.6) translateY(30px); opacity: 0; pointer-events: none;
  transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.5, 1), opacity 0.3s ease;
}
.qa-card.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
.qa-card::after {
  content: ""; position: absolute; right: 26px; bottom: -7px;
  width: 14px; height: 14px; background: #FFFDFA;
  border-right: 1px solid rgba(226, 205, 178, 0.7);
  border-bottom: 1px solid rgba(226, 205, 178, 0.7);
  transform: rotate(45deg);
}

.qa-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 18px 12px; border-bottom: 1px dashed rgba(226, 205, 178, 0.7);
}
.qa-title { font-size: 16px; font-weight: 800; color: var(--terra-deep); }
.mode-toggle {
  margin-left: auto; display: flex;
  background: var(--cream); border-radius: 10px; padding: 3px;
}
.mode-btn {
  padding: 6px 13px; border-radius: 8px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
}
.mode-btn.active {
  background: #FFFDFA; color: var(--terra-deep);
  box-shadow: 0 2px 8px rgba(160, 120, 90, 0.16);
}
.qa-close {
  width: 30px; height: 30px; border-radius: 9px; border: none;
  background: transparent; color: var(--text-secondary);
  cursor: pointer; font-size: 15px; transition: all 0.25s;
}
.qa-close:hover { background: var(--cream); color: var(--terra-deep); transform: rotate(90deg); }

.qa-body { padding: 0; overflow-y: auto; flex: 1; }
.qa-body::-webkit-scrollbar { width: 6px; }
.qa-body::-webkit-scrollbar-thumb { background: var(--wood-light); border-radius: 3px; }
.qa-body::-webkit-scrollbar-track { background: transparent; }

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
  background: rgba(200, 159, 133, 0.1);
  color: var(--terra-deep);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .nav-inner {
    padding: 0 12px;
    height: 60px;
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

  /* 移动端隐藏部分操作按钮 */
  .search-trigger {
    display: none;
  }
  .ai-btn {
    display: none;
  }

  /* 移动端操作区紧凑 */
  .nav-actions {
    gap: 2px;
  }
  .action-btn {
    width: 32px;
    height: 32px;
  }

  .page-content {
    padding: 12px;
  }
  .fab-btn {
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
  }

  /* 快速记账卡片 - 移动端底部抽屉 */
  .qa-card {
    right: 0; left: 0; bottom: 0; width: 100%;
    max-height: 88vh; border-radius: 24px 24px 0 0;
    transform: translateY(100%); opacity: 1;
  }
  .qa-card.open { transform: translateY(0); }
  .qa-card::after { display: none; }
  .qa-head {
    padding-top: 22px; position: relative;
  }
  .qa-head::before {
    content: ""; position: absolute; top: 8px; left: 50%;
    transform: translateX(-50%); width: 40px; height: 4px;
    border-radius: 2px; background: var(--wood-light);
  }

  /* 通知面板适配移动端 */
  :deep(.notification-drawer .el-drawer) {
    width: 85vw !important;
  }
}
</style>

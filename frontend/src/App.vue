<template>
  <router-view />
  <!-- PWA 安装提示 -->
  <Teleport to="body">
    <Transition name="pwa-fade">
      <div v-if="showInstallBanner" class="pwa-install-banner">
        <div class="pwa-install-content">
          <img src="/icons/icon-192.png" class="pwa-install-icon" alt="家庭管家" />
          <div class="pwa-install-info">
            <div class="pwa-install-title">安装家庭管家</div>
            <div class="pwa-install-desc">添加到桌面，像原生应用一样使用</div>
          </div>
          <div class="pwa-install-actions">
            <el-button size="small" @click="dismissInstall">稍后</el-button>
            <el-button type="primary" size="small" @click="installPWA">安装</el-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// 同步 dark class 到 html 元素
function syncDarkClass(val) {
  document.documentElement.classList.toggle('dark', val)
}
syncDarkClass(appStore.darkMode)
watch(() => appStore.darkMode, syncDarkClass)

// PWA 安装
const showInstallBanner = ref(false)
let deferredPrompt = null

function handleBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt = e
  // 检查是否已忽略过
  if (!sessionStorage.getItem('pwa-install-dismissed')) {
    showInstallBanner.value = true
  }
}

async function installPWA() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    showInstallBanner.value = false
  }
  deferredPrompt = null
}

function dismissInstall() {
  showInstallBanner.value = false
  sessionStorage.setItem('pwa-install-dismissed', '1')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstall)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
})
</script>

<style scoped>
.pwa-install-banner {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 99999; background: #fff; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15); padding: 16px 20px;
  max-width: 420px; width: calc(100% - 40px);
}
.pwa-install-content { display: flex; align-items: center; gap: 12px; }
.pwa-install-icon { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
.pwa-install-info { flex: 1; min-width: 0; }
.pwa-install-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.pwa-install-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.pwa-install-actions { display: flex; gap: 8px; flex-shrink: 0; }
.pwa-fade-enter-active, .pwa-fade-leave-active { transition: all 0.3s ease; }
.pwa-fade-enter-from, .pwa-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>

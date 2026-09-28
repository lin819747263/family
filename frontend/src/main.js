import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { useThemeStore } from './store/theme'
import { ElNotification } from 'element-plus'

// 按需注册图标（只注册实际使用的 ~60 个，而非全部 600+）
import * as Icons from './utils/icons'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(Icons)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
  ElNotification.error({ title: '应用出错', message: err.message || '未知错误', duration: 5000 })
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason)
  ElNotification.error({ title: '请求失败', message: e.reason?.message || '网络异常', duration: 5000 })
})

// 初始化主题（在挂载前设置 data-theme，避免闪烁）
useThemeStore().init()

app.mount('#app')

// 注册 Service Worker（PWA）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                window.location.reload()
              }
            })
          }
        })
      })
      .catch(() => {})
  })
}

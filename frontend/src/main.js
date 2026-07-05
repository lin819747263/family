import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import './styles/global.css'

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
app.mount('#app')

// 注册 Service Worker（PWA）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] 注册成功, scope:', reg.scope)
        // 检查更新
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[SW] 新版本已激活')
              }
            })
          }
        })
      })
      .catch((err) => console.warn('[SW] 注册失败:', err))
  })
}

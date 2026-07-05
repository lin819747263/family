import { defineStore } from 'pinia'
import { authApi } from '@/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
    families: [],
    currentFamily: JSON.parse(localStorage.getItem('currentFamily') || 'null')
  }),
  getters: {
    isLoggedIn: state => !!state.token,
    nickname: state => state.user?.nickname || state.user?.username || '用户'
  },
  actions: {
    async login(credentials) {
      const res = await authApi.login(credentials)
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      await this.getProfile()
      router.push('/')
      return res
    },
    async register(data) {
      const res = await authApi.register(data)
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      await this.getProfile()
      router.push('/')
      return res
    },
    async getProfile() {
      try {
        const res = await authApi.getProfile()
        this.user = res.data.user
        this.families = res.data.families
        localStorage.setItem('user', JSON.stringify(res.data.user))
        if (res.data.families?.length) {
          // 优先恢复之前选择的家庭，否则选第一个
          const saved = this.currentFamily
          const found = saved ? res.data.families.find(f => f.id === saved.id) : null
          this.currentFamily = found || res.data.families[0]
          localStorage.setItem('currentFamily', JSON.stringify(this.currentFamily))
        }
      } catch {
        this.logout()
      }
    },
    setCurrentFamily(family) {
      this.currentFamily = family
      if (family) localStorage.setItem('currentFamily', JSON.stringify(family))
      else localStorage.removeItem('currentFamily')
    },
    async logout() {
      try {
        // 调用后端注销接口
        if (this.token) await authApi.logout()
      } catch (e) { /* 忽略错误 */ }
      this.token = ''
      this.user = null
      this.families = []
      this.currentFamily = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('currentFamily')
      router.push('/login')
    }
  }
})

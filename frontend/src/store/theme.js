import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    current: localStorage.getItem('theme') || 'warm'
  }),
  actions: {
    set(theme) {
      this.current = theme
      document.documentElement.setAttribute('data-theme', theme === 'warm' ? '' : theme)
      localStorage.setItem('theme', theme)
    },
    init() {
      const saved = localStorage.getItem('theme')
      if (saved && saved !== 'warm') {
        document.documentElement.setAttribute('data-theme', saved)
      }
      this.current = saved || 'warm'
    }
  }
})

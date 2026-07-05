import { defineStore } from 'pinia'
import { accountingApi } from '@/api'

export const useAccountingStore = defineStore('accounting', {
  state: () => ({
    books: [],
    currentBookId: localStorage.getItem('defaultBookId') || ''
  }),
  getters: {
    currentBook: state => state.books.find(b => b.id === state.currentBookId) || null
  },
  actions: {
    async loadBooks(familyId) {
      if (!familyId) return
      const res = await accountingApi.getBooks({ familyId })
      this.books = res.data || []
      // 如果当前选中的账本不在列表中，默认选第一个
      if (this.books.length && !this.books.find(b => b.id === this.currentBookId)) {
        this.currentBookId = this.books[0].id
        localStorage.setItem('defaultBookId', this.currentBookId)
      }
    },
    setCurrentBookId(id) {
      this.currentBookId = id
      localStorage.setItem('defaultBookId', id)
    }
  }
})

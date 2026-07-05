import request from './request'

// ===== 认证 =====
export const authApi = {
  login: data => request.post('/auth/login', data),
  register: data => request.post('/auth/register', data),
  logout: () => request.post('/auth/logout'),
  getProfile: () => request.get('/auth/profile'),
  updateProfile: data => request.put('/auth/profile', data),
  changePassword: data => request.put('/auth/password', data),
  joinFamily: data => request.post('/auth/family/join', data),
  createFamily: data => request.post('/auth/family/create', data)
}

// ===== 家庭管理 =====
export const familyApi = {
  getInfo: params => request.get('/family/info', { params }),
  updateInfo: data => request.put('/family/info', data),
  getMembers: params => request.get('/family/members', { params }),
  updateMemberRole: (id, data) => request.put(`/family/members/${id}/role`, data),
  removeMember: (id, params) => request.delete(`/family/members/${id}`, { params }),
  regenerateInviteCode: data => request.post('/family/invite-code', data),
  leaveFamily: data => request.post('/family/leave', data)
}

// ===== 记账 =====
export const accountingApi = {
  getBooks: params => request.get('/accounting/books', { params }),
  createBook: data => request.post('/accounting/books', data),
  updateBook: (id, data) => request.put(`/accounting/books/${id}`, data),
  deleteBook: (id, force, silent) => request.delete(`/accounting/books/${id}`, { params: { force }, silent }),
  getTransactions: params => request.get('/accounting/transactions', { params }),
  createTransaction: data => request.post('/accounting/transactions', data),
  updateTransaction: (id, data) => request.put(`/accounting/transactions/${id}`, data),
  deleteTransaction: id => request.delete(`/accounting/transactions/${id}`),
  getCategories: params => request.get('/accounting/categories', { params }),
  createCategory: data => request.post('/accounting/categories', data),
  updateCategory: (id, data) => request.put(`/accounting/categories/${id}`, data),
  deleteCategory: id => request.delete(`/accounting/categories/${id}`),
  setBudget: data => request.post('/accounting/budgets', data),
  getBudgets: params => request.get('/accounting/budgets', { params }),
  deleteBudget: id => request.delete(`/accounting/budgets/${id}`),
  getRecurringBills: params => request.get('/accounting/recurring', { params }),
  createRecurringBill: data => request.post('/accounting/recurring', data),
  updateRecurringBill: (id, data) => request.put(`/accounting/recurring/${id}`, data),
  deleteRecurringBill: id => request.delete(`/accounting/recurring/${id}`),
  toggleRecurringBill: id => request.put(`/accounting/recurring/${id}/toggle`),
  triggerRecurringBill: id => request.post(`/accounting/recurring/${id}/trigger`),
  getDailyReport: params => request.get('/accounting/report/daily', { params }),
  getMonthlyReport: params => request.get('/accounting/report/monthly', { params }),
  getYearlyReport: params => request.get('/accounting/report/yearly', { params }),
  getYearlyCategoryReport: params => request.get('/accounting/report/yearly-category', { params }),
  getYearlyCategoryMatrix: params => request.get('/accounting/report/yearly-category-matrix', { params }),
  exportReport: params => request.get('/accounting/report/export', { params, responseType: 'blob' }),
  uploadReceipt: formData => request.post('/accounting/upload-receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ===== 相册 =====
export const albumApi = {
  getAlbums: params => request.get('/album/albums', { params }),
  createAlbum: data => request.post('/album/albums', data),
  updateAlbum: (id, data) => request.put(`/album/albums/${id}`, data),
  deleteAlbum: id => request.delete(`/album/albums/${id}`),
  verifyAlbum: (id, data) => request.post(`/album/albums/${id}/verify`, data),
  getPhotos: params => request.get('/album/photos', { params }),
  uploadPhoto: formData => request.post('/album/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: id => request.delete(`/album/photos/${id}`),
  getComments: params => request.get('/album/comments', { params }),
  addComment: data => request.post('/album/comments', data),
  toggleLike: photoId => request.post(`/album/photos/${photoId}/like`),
  shareAlbum: (id, data) => request.post(`/album/albums/${id}/share`, data),
  getStorage: params => request.get('/album/storage', { params }),
  getMemories: params => request.get('/album/memories', { params }),
  getTimeline: params => request.get('/album/timeline', { params })
}

// ===== 精彩瞬间 =====
export const momentApi = {
  getList: params => request.get('/moment', { params }),
  getOne: id => request.get(`/moment/${id}`),
  create: data => request.post('/moment', data),
  remove: id => request.delete(`/moment/${id}`),
  toggleLike: id => request.post(`/moment/${id}/like`),
  addComment: data => request.post('/moment/comments', data),
  getComments: params => request.get('/moment/comments', { params }),
  uploadImage: formData => request.post('/moment/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ===== 物品 =====
export const inventoryApi = {
  getSpaces: params => request.get('/inventory/spaces', { params }),
  createSpace: data => request.post('/inventory/spaces', data),
  updateSpace: (id, data) => request.put(`/inventory/spaces/${id}`, data),
  deleteSpace: id => request.delete(`/inventory/spaces/${id}`),
  getItems: params => request.get('/inventory/items', { params }),
  createItem: data => request.post('/inventory/items', data),
  updateItem: (id, data) => request.put(`/inventory/items/${id}`, data),
  deleteItem: id => request.delete(`/inventory/items/${id}`),
  getBorrows: params => request.get('/inventory/borrows', { params }),
  createBorrow: data => request.post('/inventory/borrows', data),
  returnBorrow: id => request.put(`/inventory/borrows/${id}/return`),
  remindBorrow: id => request.post(`/inventory/borrows/${id}/remind`),
  getUnused: params => request.get('/inventory/unused', { params }),
  getReminders: params => request.get('/inventory/reminders', { params })
}

// ===== 仪表盘 =====
export const dashboardApi = {
  getData: params => request.get('/dashboard', { params }),
  markRead: id => request.put(`/dashboard/notifications/${id}/read`),
  markAllRead: () => request.put('/dashboard/notifications/read-all')
}

// ===== 纪念日 =====
export const anniversaryApi = {
  getList: params => request.get('/anniversary', { params }),
  getOne: id => request.get(`/anniversary/${id}`),
  create: data => request.post('/anniversary', data),
  update: (id, data) => request.put(`/anniversary/${id}`, data),
  remove: id => request.delete(`/anniversary/${id}`),
  getUpcoming: params => request.get('/anniversary/upcoming', { params }),
  triggerReminders: data => request.post('/anniversary/trigger-reminders', data),
  getLunarInfo: params => request.get('/anniversary/lunar-info', { params }),
  getSolarDate: params => request.get('/anniversary/solar-date', { params })
}

// ===== 菜谱 =====
export const recipeApi = {
  getList: params => request.get('/recipe', { params }),
  getOne: id => request.get(`/recipe/${id}`),
  create: data => request.post('/recipe', data),
  update: (id, data) => request.put(`/recipe/${id}`, data),
  remove: id => request.delete(`/recipe/${id}`),
  uploadImage: formData => request.post('/recipe/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  random: params => request.get('/recipe/random', { params })
}

// ===== 待办清单 =====
export const todoApi = {
  getList: params => request.get('/todo', { params }),
  getOne: id => request.get(`/todo/${id}`),
  create: data => request.post('/todo', data),
  update: (id, data) => request.put(`/todo/${id}`, data),
  remove: id => request.delete(`/todo/${id}`),
  toggleComplete: id => request.put(`/todo/${id}/toggle`),
  archive: id => request.put(`/todo/${id}/archive`),
  unarchive: id => request.put(`/todo/${id}/unarchive`),
  archiveCompleted: data => request.post('/todo/archive-completed', data),
  getUpcoming: params => request.get('/todo/upcoming', { params }),
  getStats: params => request.get('/todo/stats', { params })
}

// ===== 心愿清单 =====
export const wishlistApi = {
  getList: params => request.get('/wishlist', { params }),
  getOne: id => request.get(`/wishlist/${id}`),
  create: data => request.post('/wishlist', data),
  update: (id, data) => request.put(`/wishlist/${id}`, data),
  remove: id => request.delete(`/wishlist/${id}`)
}

// ===== 家庭日记 =====
export const diaryApi = {
  getList: params => request.get('/diary', { params }),
  getOne: id => request.get(`/diary/${id}`),
  create: data => request.post('/diary', data),
  update: (id, data) => request.put(`/diary/${id}`, data),
  remove: id => request.delete(`/diary/${id}`)
}

// ===== 理财投资 =====
export const investmentApi = {
  getPlatforms: params => request.get('/investment/platforms', { params }),
  getList: params => request.get('/investment', { params }),
  upsert: data => request.post('/investment', data),
  remove: id => request.delete(`/investment/${id}`),
  getYearlyStats: params => request.get('/investment/stats/yearly', { params }),
  getMultiYearStats: params => request.get('/investment/stats/multi-year', { params })
}

// ===== 家庭成员档案 =====
export const memberProfileApi = {
  getList: params => request.get('/member-profile', { params }),
  getOne: id => request.get(`/member-profile/${id}`),
  create: data => request.post('/member-profile', data),
  update: (id, data) => request.put(`/member-profile/${id}`, data),
  remove: id => request.delete(`/member-profile/${id}`),
  addRecord: (id, data) => request.post(`/member-profile/${id}/record`, data),
  getRecordHistory: (id, params) => request.get(`/member-profile/${id}/record`, { params }),
  updateRecord: (id, type, recordId, data) => request.put(`/member-profile/${id}/record/${type}/${recordId}`, data),
  deleteRecord: (id, type, recordId) => request.delete(`/member-profile/${id}/record/${type}/${recordId}`)
}

// ===== 日历视图 =====
export const calendarApi = {
  getMonthEvents: params => request.get('/calendar/events', { params }),
  getDayEvents: params => request.get('/calendar/day', { params })
}

// ===== 后台管理 =====
export const adminApi = {
  getStats: () => request.get('/admin/stats'),
  getUsers: params => request.get('/admin/users', { params }),
  getUserDetail: id => request.get(`/admin/users/${id}`),
  resetPassword: (id, data) => request.put(`/admin/users/${id}/reset-password`, data),
  updateUserStatus: (id, data) => request.put(`/admin/users/${id}/status`, data),
  getSettings: () => request.get('/admin/settings'),
  updateSettings: data => request.put('/admin/settings', data)
}

// ===== AI 助手 =====
export const aiApi = {
  chat: data => request.post('/ai/chat', data)
}

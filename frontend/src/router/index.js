import { createRouter, createWebHistory } from 'vue-router'
import { appConfig } from '@/config'

const loginComponent = appConfig.loginStyle === 'animated'
  ? () => import('@/views/auth/LoginAnimated.vue')
  : appConfig.loginStyle === 'warm'
    ? () => import('@/views/auth/LoginWarm.vue')
    : () => import('@/views/auth/Login.vue')

const routes = [
  { path: '/login', name: 'Login', component: loginComponent, meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/Register.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/dashboard/Index.vue') },
      { path: 'accounting', name: 'Accounting', component: () => import('@/views/accounting/Index.vue') },
      { path: 'accounting/books', name: 'AccountBooks', component: () => import('@/views/accounting/Books.vue') },
      { path: 'accounting/budgets', name: 'Budgets', component: () => import('@/views/accounting/Budgets.vue') },
      { path: 'accounting/report', name: 'Report', component: () => import('@/views/accounting/Report.vue') },
      { path: 'accounting/recurring', name: 'RecurringBills', component: () => import('@/views/accounting/RecurringBills.vue') },
      { path: 'accounting/annual-report', name: 'AnnualReport', component: () => import('@/views/accounting/AnnualReport.vue') },
      { path: 'accounting/categories', name: 'Categories', component: () => import('@/views/accounting/Categories.vue') },
      { path: 'album', name: 'Album', component: () => import('@/views/album/Index.vue') },
      { path: 'album/:id', name: 'AlbumDetail', component: () => import('@/views/album/Detail.vue') },
      { path: 'album/memories', name: 'Memories', component: () => import('@/views/album/Memories.vue') },
      { path: 'album/timeline', name: 'Timeline', component: () => import('@/views/album/Timeline.vue') },
      { path: 'album/moments', name: 'Moments', component: () => import('@/views/album/Moments.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('@/views/inventory/Index.vue') },
      { path: 'inventory/spaces', name: 'Spaces', component: () => import('@/views/inventory/Spaces.vue') },
      { path: 'inventory/borrows', name: 'Borrows', component: () => import('@/views/inventory/Borrows.vue') },
      { path: 'inventory/unused', name: 'UnusedItems', component: () => import('@/views/inventory/Unused.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
      { path: 'family', name: 'Family', component: () => import('@/views/family/Index.vue') },
      {
        path: 'reminder',
        component: () => import('@/views/reminder/Index.vue'),
        children: [
          { path: '', redirect: '/reminder/todo' },
          { path: 'todo', name: 'Todo', component: () => import('@/views/todo/Index.vue') },
          { path: 'calendar', name: 'Calendar', component: () => import('@/views/anniversary/Calendar.vue') },
          { path: 'anniversary', name: 'Anniversary', component: () => import('@/views/anniversary/Index.vue') }
        ]
      },
      { path: 'recipe', name: 'Recipe', component: () => import('@/views/recipe/Index.vue') },
      { path: 'member', name: 'MemberProfile', component: () => import('@/views/member/Index.vue') },
      { path: 'wishlist', name: 'Wishlist', component: () => import('@/views/wishlist/Index.vue') },
      { path: 'diary', name: 'Diary', component: () => import('@/views/diary/Index.vue') },
      { path: 'investment', name: 'Investment', component: () => import('@/views/investment/Index.vue') },
      { path: 'annual-goals', name: 'AnnualGoals', component: () => import('@/views/annual-goals/Index.vue') },
      { path: 'admin', name: 'Admin', component: () => import('@/views/admin/Index.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

// 简单的顶部加载条
let loadingBar = null
let loadingTimer = null

function startLoading() {
  if (!loadingBar) {
    loadingBar = document.createElement('div')
    loadingBar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#C89F85,#E8B36A);z-index:99999;transition:width 0.3s ease;pointer-events:none;'
    document.body.appendChild(loadingBar)
  }
  loadingBar.style.width = '0%'
  loadingBar.style.opacity = '1'
  clearTimeout(loadingTimer)
  setTimeout(() => { if (loadingBar) loadingBar.style.width = '70%' }, 10)
}

function finishLoading() {
  if (loadingBar) {
    loadingBar.style.width = '100%'
    loadingTimer = setTimeout(() => {
      if (loadingBar) loadingBar.style.opacity = '0'
    }, 300)
  }
}

router.beforeEach((to, from, next) => {
  if (to.path !== from.path) startLoading()
  const token = localStorage.getItem('token')
  if (to.meta.auth && !token) next('/login')
  else if (to.meta.guest && token) next('/')
  else if (to.name === 'Admin') {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!token) { next('/login'); return }
      if (user.role !== 'admin') { next('/'); return }
    } catch { next('/'); return }
    next()
  }
  else next()
})

router.afterEach(() => { finishLoading() })

export default router

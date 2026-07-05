import { useAuthStore } from '@/store/auth'

/**
 * 家庭守卫 composable
 * 确保用户已登录且已加入家庭
 * @returns {Promise<boolean>} 是否有家庭
 */
export async function useFamilyGuard() {
  const authStore = useAuthStore()
  if (!authStore.currentFamily && authStore.isLoggedIn) {
    await authStore.getProfile()
  }
  return !!authStore.currentFamily
}

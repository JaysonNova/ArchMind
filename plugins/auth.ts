/**
 * 认证插件
 * 在应用启动时自动检查用户登录状态
 */

export default defineNuxtPlugin(async () => {
  // 只在客户端执行
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // 检查认证状态
  await authStore.checkAuth()
})

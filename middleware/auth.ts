/**
 * 认证路由中间件
 * 保护需要登录才能访问的页面
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // 只在客户端执行
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // 不需要认证的页面
  const publicPages = ['/login', '/register']

  // 如果是公开页面，直接放行
  if (publicPages.includes(to.path)) {
    return
  }

  // 检查认证状态
  await authStore.checkAuth()

  // 如果未登录，重定向到登录页面
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})

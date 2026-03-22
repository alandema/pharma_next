interface User {
  role: string
}

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin'

export default defineNuxtRouteMiddleware(async (to) => {
  const allowedPaths = ['/auth/login']
  if (allowedPaths.includes(to.path)) return

  let user: User
  try {
    user = await $fetch<User>('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: useRequestHeaders(['cookie'])
    })
  } catch {
    return navigateTo('/auth/login')
  }

  if (to.path.startsWith('/admin') && !isAdminRole(user.role)) return navigateTo('/')
  if (to.path === '/' && isAdminRole(user.role)) return navigateTo('/admin')
})

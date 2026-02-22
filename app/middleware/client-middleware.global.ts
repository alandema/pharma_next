interface User {
  role: string
}

export default defineNuxtRouteMiddleware(async (to) => {
  const allowedPaths = ['/auth/login', '/auth/signup']
  if (allowedPaths.includes(to.path)) return

  const user = await $fetch<User>('/api/users/me', {
    method: 'GET',
    credentials: 'include',
    headers: useRequestHeaders(['cookie'])
  }).catch(() => null)

  if (!user) return navigateTo('/auth/login')

  if (to.path.startsWith('/admin') && user.role !== 'admin') return navigateTo('/')
  if (to.path === '/' && user.role === 'admin') return navigateTo('/admin')
})

interface Prescriber {
  role: string
}

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin'

export default defineNuxtRouteMiddleware(async (to) => {
  const allowedPaths = ['/auth/login']
  if (allowedPaths.includes(to.path)) return

  let prescriber: Prescriber
  try {
    prescriber = await $fetch<Prescriber>('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: useRequestHeaders(['cookie'])
    })
  } catch {
    return navigateTo('/auth/login')
  }

  if (to.path.startsWith('/admin') && !isAdminRole(prescriber.role)) return navigateTo('/')
  if (to.path === '/' && isAdminRole(prescriber.role)) return navigateTo('/admin')
})

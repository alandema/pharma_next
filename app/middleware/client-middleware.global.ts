import { useCurrentUser } from '../composables/useCurrentUser'

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin'

export default defineNuxtRouteMiddleware(async (to) => {
  const allowedPaths = ['/auth/login']
  if (allowedPaths.includes(to.path)) return

  const { loadCurrentUser } = useCurrentUser()
  const prescriber = await loadCurrentUser()

  if (!prescriber) return navigateTo('/auth/login')
  const role = prescriber.role

  if (to.path.startsWith('/admin') && !isAdminRole(role)) return navigateTo('/')
  if (to.path === '/' && isAdminRole(role)) return navigateTo('/admin')
})

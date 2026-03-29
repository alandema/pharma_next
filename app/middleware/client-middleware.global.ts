interface Prescriber {
  role: string
}

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin'

const getRole = (prescriber: unknown): string | undefined => {
  if (!prescriber || typeof prescriber !== 'object') return undefined

  const { role } = prescriber as { role?: unknown }
  return typeof role === 'string' ? role : undefined
}

export default defineNuxtRouteMiddleware(async (to) => {
  const allowedPaths = ['/auth/login']
  if (allowedPaths.includes(to.path)) return

  let prescriber: Prescriber | null = null
  try {
    prescriber = await $fetch<Prescriber | null>('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: useRequestHeaders(['cookie'])
    })
  } catch {
    return navigateTo('/auth/login')
  }

  const role = getRole(prescriber)
  if (!role) return navigateTo('/auth/login')

  if (to.path.startsWith('/admin') && !isAdminRole(role)) return navigateTo('/')
  if (to.path === '/' && isAdminRole(role)) return navigateTo('/admin')
})

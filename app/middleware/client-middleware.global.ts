
interface User {
  role: string
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log('Running global client middleware for route:', to.path)

  //   if (import.meta.server) {
  //     console.log('This middleware is running on the server, skipping auth checks.')
  //   return
  // }

  //   // skip middleware on client side entirely
  // if (import.meta.client) {
  //   console.log('This middleware is running on the client, skipping auth checks.')
  //   return
  // }
  // // or only skip middleware on initial client load
  const nuxtApp = useNuxtApp()
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    console.log('Initial client load, skipping auth checks.')
    return
  }


  const allowedPaths = ['/auth/login', '/auth/signup']

  const adminPaths = ['/admin']
  
  const headers = useRequestHeaders(['cookie'])

  // 1. Always let users visit login/signup without any checks
  if (allowedPaths.includes(to.path)) {
    console.log('Allowed path, no auth check needed.')
    return
  }

  // 2. No cookie at all → redirect immediately, no API call needed
  const userCookie = useCookie('AccessToken')
  if (!userCookie.value) {
    console.log('No cookie found, redirecting to login.')
    return navigateTo('/auth/login')
  }

  // 3. Cookie exists → validate it server-side

    const user = await $fetch<User>('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: headers
    }).catch(() => null)

  if (!user) {
    console.log('Invalid token, redirecting to login.')
    return navigateTo('/auth/login')
  }

  console.log(user.role)
  console.log(to.path)
  if (adminPaths.some(path => to.path.startsWith(path)) && user.role !== 'admin') {
    console.log('User is not admin, redirecting to home.')
    return navigateTo('/')
  }

  return true

})


export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log('Running global client middleware for route:', to.path)

  const allowedPaths = ['/auth/login', '/auth/signup']

  const headers = useRequestHeaders(['cookie'])

  // 1. Always let users visit login/signup without any checks
  if (allowedPaths.includes(to.path)) {
    console.log('Allowed path, no auth check needed.')
    return
  }

  // 2. No cookie at all → redirect immediately, no API call needed
  // const userCookie = useCookie('AccessToken')
  // if (!userCookie.value) {
  //   console.log('No cookie found, redirecting to login.')
  //   return navigateTo('/auth/login')
  // }

  // 3. Cookie exists → validate it server-side

    const user = await $fetch('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: headers
    }).catch(() => null)

  if (!user) {
    console.log('Invalid token, redirecting to login.')
    return navigateTo('/auth/login')
  }

  return true

})

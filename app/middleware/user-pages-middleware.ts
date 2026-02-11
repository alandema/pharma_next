interface User {
  role: string
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  //   console.log('Running user pages middleware for route:', to.path)

  // //     if (import.meta.server) {
  // //       console.log('This middleware is running on the server, skipping auth checks.')
  // //   return
  // // }

  //   //   const userCookie = useCookie('AccessToken')
  //   // if (!userCookie.value) {
  //   //     console.log('No cookie found, redirecting to login.')
  //   //     return navigateTo('/auth/login')
  //   // }

  //   const headers = useRequestHeaders(['cookie'])

  //   const user = await $fetch<User>('/api/users/me', {
  //     method: 'GET',
  //     credentials: 'include',
  //     headers: headers
  //   }).catch(() => null)

  // if (!user) {
  //   console.log('Invalid token, redirecting to login.')
  //   return navigateTo('/auth/login')
  // }
})

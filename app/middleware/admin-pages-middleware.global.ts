interface User {
  role: string
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  //   console.log('Running admin pages middleware for route:', to.path)

  //   const headers = useRequestHeaders(['cookie'])

  //   const user = await $fetch<User>('/api/users/me', {
  //     method: 'GET',
  //     credentials: 'include',
  //     headers: headers
  //   }).catch(() => null)

  // if (!user) {
  //   console.log('Invalid token for admin, redirecting to login.')
  //   return navigateTo('/auth/login')
  // }

  // if (user.role !== 'admin') {
  //   console.log('User is not admin, redirecting to home.')
  //   return navigateTo('/')
  // }
})

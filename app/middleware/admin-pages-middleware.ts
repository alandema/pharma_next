interface Prescriber {
  role: string
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  //   console.log('Running admin pages middleware for route:', to.path)

  //   const headers = useRequestHeaders(['cookie'])

  //   const prescriber = await $fetch<Prescriber>('/api/users/me', {
  //     method: 'GET',
  //     credentials: 'include',
  //     headers: headers
  //   }).catch(() => null)

  // if (!prescriber) {
  //   console.log('Invalid token for admin, redirecting to login.')
  //   return navigateTo('/auth/login')
  // }

  // if (prescriber.role !== 'admin') {
  //   console.log('Prescriber is not admin, redirecting to home.')
  //   return navigateTo('/')
  // }
})

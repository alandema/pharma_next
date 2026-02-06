export default defineNuxtRouteMiddleware((to, from) => {

    console.log('Middleware executed on client side')
  // this console log can be seen in the browser console
  if (to.params.id === '1') {
    return abortNavigation()
  }
  // In a real app you would probably not redirect every route to `/`
  // however it is important to check `to.path` before redirecting or you
  // might get an infinite redirect loop


  // if (to.path !== '/') {
  //   return navigateTo('/')
  // }
})

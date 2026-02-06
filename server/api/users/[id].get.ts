export default defineEventHandler((event) => {
  const user_id = getRouterParam(event, 'id')

  return `Hello, ${user_id}!`
})
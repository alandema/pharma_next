// server/api/auth/logout.post.ts
export default defineEventHandler((event) => {
  // Delete the auth cookies
  deleteCookie(event, 'AccessToken', { path: '/' })
  // Add any other cookies you want to clear
  
  return {
    success: true,
    message: 'Logged out successfully'
  }
})
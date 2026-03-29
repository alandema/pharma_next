export const validatePassword = (password: unknown) => {
  if (typeof password !== 'string') return 'Missing password'
  if (!password) return 'Missing password'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 25) return 'Password must be at most 25 characters'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain letters and numbers'
  return ''
}
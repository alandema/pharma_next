export type CurrentUser = {
  id: string
  email: string
  full_name: string
  role: string
  userId?: string
}

const hasCurrentUserShape = (value: unknown): value is CurrentUser => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<CurrentUser>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string'
  )
}

const getRequestHeaders = () => {
  if (import.meta.server) {
    return useRequestHeaders(['cookie'])
  }

  return undefined
}

export const useCurrentUser = () => {
  const currentUser = useState<CurrentUser | null | undefined>('current-user', () => undefined)

  const setCurrentUser = (user: CurrentUser | null) => {
    currentUser.value = user
  }

  const clearCurrentUser = () => {
    currentUser.value = null
  }

  const loadCurrentUser = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false
    if (!force && currentUser.value !== undefined) {
      return currentUser.value
    }

    try {
      const response = await $fetch<CurrentUser | null>('/api/users/me', {
        method: 'GET',
        credentials: 'include',
        headers: getRequestHeaders(),
      })

      currentUser.value = hasCurrentUserShape(response) ? response : null
    } catch {
      currentUser.value = null
    }

    return currentUser.value
  }

  return {
    currentUser,
    loadCurrentUser,
    setCurrentUser,
    clearCurrentUser,
  }
}

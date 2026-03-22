const toasts = ref<{ id: number; message: string; type: 'error' | 'warning' | 'success' }[]>([])
let nextId = 0

export const useToast = () => {
  const add = (message: string = 'Algo deu errado', type: 'error' | 'warning' | 'success' = 'error', duration = 4000) => {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, duration)
  }

  return { toasts, add }
}

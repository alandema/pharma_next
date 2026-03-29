const toasts = ref<{ id: number; message: string; type: 'error' | 'warning' | 'success' }[]>([])
let nextId = 0

const FIELD_LABELS: Record<string, string> = {
  email: 'E-mail',
  phone: 'Telefone',
  full_name: 'Nome completo',
  cpf: 'CPF',
  gender: 'Sexo',
  birth_date: 'Data de nascimento',
  council: 'Conselho',
  council_number: 'Número do conselho',
  council_state: 'UF do conselho',
  zipcode: 'CEP',
  street: 'Endereço',
  address_number: 'Número',
  city: 'Cidade',
  state: 'Estado',
}

const normalizeErrorToastMessage = (message: string) => {
  const compact = String(message ?? '').trim().replace(/\s+/g, ' ')

  if (!compact) {
    return 'Não foi possível concluir a operação. Tente novamente.'
  }

  const requiredFieldMatch = compact.match(/Argument `([^`]+)` must not be null/i)
  if (requiredFieldMatch) {
    const field = requiredFieldMatch[1] ?? ''
    const label = FIELD_LABELS[field] ?? 'Campo obrigatório'
    return `${label} é obrigatório.`
  }

  if (/invalid\s+`prisma\.|invocation:/i.test(compact) || compact.length > 220) {
    return 'Não foi possível salvar os dados. Verifique os campos obrigatórios e tente novamente.'
  }

  return compact
}

export const useToast = () => {
  const add = (message: string = 'Algo deu errado', type: 'error' | 'warning' | 'success' = 'error', duration = 4000) => {
    const id = nextId++
    const finalMessage = type === 'error' ? normalizeErrorToastMessage(message) : message
    toasts.value.push({ id, message: finalMessage, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, duration)
  }

  return { toasts, add }
}

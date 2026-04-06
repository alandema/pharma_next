const DIGIT_REGEX = /\D+/g
import parsePhoneNumber from 'libphonenumber-js'

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const onlyDigits = (value: unknown) => String(value ?? '').replace(DIGIT_REGEX, '')

export const toTitleCase = (value: string) => value.toLowerCase().split(' ').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

export const normalizeText = (value: unknown, options?: { titleCase?: boolean }) => {
  if (typeof value !== 'string') return null
  const compact = value.trim().replace(/\s+/g, ' ')
  if (!compact) return null
  return options?.titleCase ? toTitleCase(compact) : compact
}

export const normalizeBoolean = (value: unknown) => {
  if (typeof value !== 'boolean') {
    throw new Error('Valor booleano inválido')
  }
  return value
}

export const isBrazilCountry = (value: unknown) => {
  const normalized = removeDiacritics(String(value ?? '').trim().toLowerCase())
  return normalized === 'brasil'
}

export const normalizeBrazilPhone = (value: unknown, required = false) => {
  const raw = String(value ?? '').trim()

  if (!raw) {
    if (required) throw new Error('Telefone é obrigatório')
    return null
  }

  const parsed = raw.startsWith('+')
    ? parsePhoneNumber(raw)
    : parsePhoneNumber(raw, 'BR')

  if (!parsed || !parsed.isValid()) {
    throw new Error('Telefone inválido. Use um número válido com DDI (ex: +55 11 91234-5678)')
  }

  return parsed.number
}

export const normalizeBrazilCep = (value: unknown, required = false) => {
  const digits = onlyDigits(value)

  if (!digits) {
    if (required) throw new Error('CEP é obrigatório')
    return null
  }

  if (digits.length !== 8) {
    throw new Error('CEP inválido. Use 00000-000')
  }

  return digits
}

const formatBrazilCpf = (digits: string) => `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`

const isValidBrazilCpfDigits = (digits: string) => {
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let firstCheckSum = 0
  for (let index = 0; index < 9; index++) {
    firstCheckSum += Number(digits[index]) * (10 - index)
  }

  const firstRemainder = (firstCheckSum * 10) % 11
  const firstCheckDigit = firstRemainder === 10 ? 0 : firstRemainder
  if (firstCheckDigit !== Number(digits[9])) return false

  let secondCheckSum = 0
  for (let index = 0; index < 10; index++) {
    secondCheckSum += Number(digits[index]) * (11 - index)
  }

  const secondRemainder = (secondCheckSum * 10) % 11
  const secondCheckDigit = secondRemainder === 10 ? 0 : secondRemainder
  return secondCheckDigit === Number(digits[10])
}

export const normalizeBrazilCpf = (value: unknown, required = false) => {
  const raw = String(value ?? '').trim()

  if (!raw) {
    if (required) throw new Error('CPF é obrigatório')
    return null
  }

  const digits = onlyDigits(raw)
  if (!isValidBrazilCpfDigits(digits)) {
    throw new Error('CPF inválido. Use um CPF válido no formato 000.000.000-00')
  }

  return formatBrazilCpf(digits)
}

export const parseDateOnlyToUtcDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const parts = value.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day))

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null
  }

  return utcDate
}

export const normalizeBirthDate = (value: unknown) => {
  const utcDate = parseDateOnlyToUtcDate(value)
  if (!utcDate) {
    throw new Error('Data de nascimento inválida')
  }

  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  if (utcDate.getTime() > todayUtc) {
    throw new Error('Data de nascimento não pode ser futura')
  }

  return utcDate
}

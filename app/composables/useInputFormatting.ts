const DIGIT_REGEX = /\D+/g
import { AsYouType } from 'libphonenumber-js'

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const useInputFormatting = () => {
  const onlyDigits = (value: unknown) => String(value ?? '').replace(DIGIT_REGEX, '')

  const formatCpfInput = (value: unknown) => {
    const digits = onlyDigits(value).slice(0, 11)

    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const isValidBrazilCpf = (value: unknown) => {
    const digits = onlyDigits(value)

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

  const formatBrazilPhoneInput = (value: unknown) => {
    const raw = String(value ?? '').trim()
    if (!raw) return ''

    const digits = onlyDigits(raw)
    if (!raw.startsWith('+') && digits.length <= 2) {
      return digits
    }

    // '+' means international mode; otherwise always treat as Brazilian local input.
    const formatter = raw.startsWith('+') ? new AsYouType() : new AsYouType('BR')
    return formatter.input(raw)
  }

  const phoneToStoredDigits = (value: unknown) => {
    const raw = String(value ?? '').trim()
    const digits = onlyDigits(raw)
    const hasExplicitCountryCode = /^\+\s*55/.test(raw)
    const hasPastedCountryCode = digits.startsWith('55') && digits.length > 11
    let localDigits = hasExplicitCountryCode || hasPastedCountryCode ? digits.slice(2) : digits

    localDigits = localDigits.slice(0, 11)
    if (!localDigits) return ''

    return `55${localDigits}`
  }

  const formatCepInput = (value: unknown) => {
    const digits = onlyDigits(value).slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const cepToStoredDigits = (value: unknown) => onlyDigits(value).slice(0, 8)

  const toTitleCase = (value: string) => value.toLowerCase().split(' ').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  const normalizeText = (value: unknown, options?: { titleCase?: boolean }) => {
    if (typeof value !== 'string') return ''
    const compact = value.trim().replace(/\s+/g, ' ')
    if (!compact) return ''
    return options?.titleCase ? toTitleCase(compact) : compact
  }

  const isBrazilCountry = (value: unknown) => {
    const normalized = removeDiacritics(normalizeText(value)).toLowerCase()
    return normalized === 'brasil'
  }

  const isValidBirthDate = (value: unknown) => {
    if (typeof value !== 'string' || !value) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const parts = value.split('-')
    const year = Number(parts[0])
    const month = Number(parts[1])
    const day = Number(parts[2])

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return false
    }

    const date = new Date(Date.UTC(year, month - 1, day))

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return false
    }

    const today = new Date()
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    return date.getTime() <= todayUtc
  }

  return {
    onlyDigits,
    formatCpfInput,
    isValidBrazilCpf,
    formatBrazilPhoneInput,
    phoneToStoredDigits,
    formatCepInput,
    cepToStoredDigits,
    normalizeText,
    toTitleCase,
    isBrazilCountry,
    isValidBirthDate,
  }
}

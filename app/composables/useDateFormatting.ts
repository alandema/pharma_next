const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

const DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/

const datePartsFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimePartsFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const inputDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const getPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) => {
  return parts.find((part) => part.type === type)?.value ?? ''
}

const parseDatePrefix = (value: string): Date | null => {
  const match = value.match(DATE_PREFIX_REGEX)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  // Midday UTC avoids shifting to previous day when rendered in UTC-3.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

const toDate = (value: unknown, preferDatePrefix: boolean): Date | null => {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value !== 'string') return null

  const raw = value.trim()
  if (!raw) return null

  if (preferDatePrefix) {
    const dateFromPrefix = parseDatePrefix(raw)
    if (dateFromPrefix) return dateFromPrefix
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return parseDatePrefix(raw)
}

const toInputDate = (date: Date): string => {
  const parts = inputDateFormatter.formatToParts(date)
  const day = getPart(parts, 'day')
  const month = getPart(parts, 'month')
  const year = getPart(parts, 'year')
  return `${year}-${month}-${day}`
}

export const useDateFormatting = () => {
  const formatDatePtBR = (value: unknown, fallback = '—') => {
    const date = toDate(value, true)
    if (!date) return fallback

    const parts = datePartsFormatter.formatToParts(date)
    const day = getPart(parts, 'day')
    const month = getPart(parts, 'month')
    const year = getPart(parts, 'year')
    return `${day}/${month}/${year}`
  }

  const formatDateTimePtBR = (value: unknown, fallback = '—') => {
    const date = toDate(value, false)
    if (!date) return fallback

    const parts = dateTimePartsFormatter.formatToParts(date)
    const day = getPart(parts, 'day')
    const month = getPart(parts, 'month')
    const year = getPart(parts, 'year')
    const hour = getPart(parts, 'hour')
    const minute = getPart(parts, 'minute')
    return `${day}/${month}/${year} ${hour}:${minute}`
  }

  const getTodayInputDate = () => toInputDate(new Date())

  return {
    formatDatePtBR,
    formatDateTimePtBR,
    getTodayInputDate,
    BRAZIL_TIME_ZONE,
  }
}
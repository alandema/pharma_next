import { createError, getValidatedQuery, getValidatedRouterParams, readValidatedBody } from 'h3'
import type { H3Event } from 'h3'
import type { ZodIssue } from 'zod'
import { z } from 'zod'

const ISSUE_MESSAGES = {
  invalidBody: 'Corpo da requisição inválido.',
  invalidQuery: 'Parâmetros de consulta inválidos.',
  invalidParams: 'Parâmetros de rota inválidos.',
} as const

const formatPath = (issue: ZodIssue) => {
  if (!issue.path.length) return 'requisição'
  return issue.path.join('.')
}

const normalizeValidationIssue = (issue: ZodIssue) => {
  if (issue.code === 'unrecognized_keys') {
    const keys = issue.keys.join(', ')
    return `A requisição contém campos não permitidos: ${keys}.`
  }

  const path = formatPath(issue)

  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return `Campo ${path} é obrigatório.`
  }

  return `Campo ${path} inválido.`
}

const toRequestValidationMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0]
    if (!firstIssue) return fallbackMessage
    return normalizeValidationIssue(firstIssue)
  }

  return fallbackMessage
}

export const readStrictBody = async <TSchema extends z.ZodTypeAny>(
  event: H3Event,
  schema: TSchema,
  fallbackMessage: string = ISSUE_MESSAGES.invalidBody,
): Promise<z.infer<TSchema>> => {
  try {
    return await readValidatedBody(event, schema)
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: toRequestValidationMessage(error, fallbackMessage) })
  }
}

export const getStrictQuery = async <TSchema extends z.ZodTypeAny>(
  event: H3Event,
  schema: TSchema,
  fallbackMessage: string = ISSUE_MESSAGES.invalidQuery,
): Promise<z.infer<TSchema>> => {
  try {
    return await getValidatedQuery(event, schema)
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: toRequestValidationMessage(error, fallbackMessage) })
  }
}

export const getStrictRouterParams = async <TSchema extends z.ZodTypeAny>(
  event: H3Event,
  schema: TSchema,
  fallbackMessage: string = ISSUE_MESSAGES.invalidParams,
): Promise<z.infer<TSchema>> => {
  try {
    return await getValidatedRouterParams(event, schema)
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: toRequestValidationMessage(error, fallbackMessage) })
  }
}

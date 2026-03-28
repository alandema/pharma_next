import type { H3Event } from 'h3'
import { createError } from 'h3'

export const ROLES = ['user', 'admin', 'superadmin'] as const

export type AppRole = typeof ROLES[number]

export type AuthUser = {
  userId: string
  username?: string
  role: AppRole
}

export const isKnownRole = (role: unknown): role is AppRole => {
  return typeof role === 'string' && (ROLES as readonly string[]).includes(role)
}

export const isAdminLike = (role: unknown): role is 'admin' | 'superadmin' => {
  return role === 'admin' || role === 'superadmin'
}

export const isSuperadmin = (role: unknown): role is 'superadmin' => role === 'superadmin'

export const requireAuthenticatedUser = (event: H3Event): AuthUser => {
  const raw = (event.context as any).user as Partial<AuthUser> | undefined

  if (!raw?.userId || typeof raw.userId !== 'string' || !isKnownRole(raw.role)) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado.' })
  }

  return {
    userId: raw.userId,
    username: raw.username,
    role: raw.role,
  }
}

export const requireAdminLikeUser = (event: H3Event): AuthUser => {
  const user = requireAuthenticatedUser(event)

  if (!isAdminLike(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado: apenas administradores.' })
  }

  return user
}

export const assertCanManageTargetRole = (actorRole: AppRole, targetRole: AppRole) => {
  if (targetRole === 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado: contas superadmin são gerenciadas fora da aplicação.' })
  }

  if (actorRole === 'admin' && targetRole !== 'user') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado: administradores só podem gerenciar contas de usuário.' })
  }

  if (actorRole === 'superadmin' && targetRole !== 'user' && targetRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado: papel de destino inválido.' })
  }
}

export const USER_SAFE_SELECT = {
  id: true,
  username: true,
  email: true,
  send_email: true,
  role: true,
  is_active: true,
  full_name: true,
  cpf: true,
  gender: true,
  birth_date: true,
  phone: true,
  council: true,
  council_number: true,
  council_state: true,
  zipcode: true,
  street: true,
  address_number: true,
  complement: true,
  city: true,
  state: true,
  created_at: true,
} as const

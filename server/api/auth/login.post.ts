import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { isKnownRole } from '../../utils/rbac';
const config = useRuntimeConfig()
const JWT_SECRET = config.jwtSecret

const parseJwtExpiresToSeconds = (rawValue: string): number => {
  const value = rawValue.trim()

  if (/^\d+$/.test(value)) {
    const seconds = Number(value)
    if (seconds > 0) return seconds
    throw new Error('JWT_EXPIRES must be greater than zero')
  }

  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error('JWT_EXPIRES must use s, m, h or d suffix (example: 8h)')
  }

  const amount = Number(match[1])
  const unit = match[2]

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('JWT_EXPIRES amount must be greater than zero')
  }

  switch (unit) {
    case 's':
      return amount
    case 'm':
      return amount * 60
    case 'h':
      return amount * 60 * 60
    case 'd':
      return amount * 60 * 60 * 24
    default:
      throw new Error('JWT_EXPIRES unit is invalid')
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { username, password} = body;
  if (!username || !password) { 
    throw createError({
      statusCode: 400,
      statusMessage: 'Usuário ou senha ausentes'
    });
  }

  const existing = await prisma.user.findUnique(
    { where: { username },
    select: { id: true, password_hash: true, username: true, role: true, is_active: true }
    });

  if (!existing) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário ou senha inválidos'
    });
  }

  if (!(await bcrypt.compare(password, existing.password_hash))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário ou senha inválidos'
    });
  }

  if (!existing.is_active) {
    throw createError({ statusCode: 403, statusMessage: 'Conta inativa. Ative a conta pelo link enviado no e-mail.' });
  }

  if (!isKnownRole(existing.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Papel de usuário inválido.' })
  }

  const jwtExpires = String(config.jwtExpires || '').trim()
  if (!jwtExpires) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_EXPIRES não configurado.' })
  }

  let maxAgeSeconds = 0
  try {
    maxAgeSeconds = parseJwtExpiresToSeconds(jwtExpires)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'JWT_EXPIRES inválido. Use formato como 8h.' })
  }

  const token = jwt.sign(
      { userId: existing.id, username: existing.username , role: existing.role} as JwtPayload,
      JWT_SECRET!,
      { expiresIn: maxAgeSeconds }
    );

    // set token in httpOnly cookie
    setCookie(event, 'AccessToken', token, {
      httpOnly: true,
      secure: config.public.nodeEnv === 'production',
      maxAge: maxAgeSeconds,
      sameSite: 'lax',
      path: '/'
    })

    return {
      message: 'Login realizado com sucesso'
    };

})
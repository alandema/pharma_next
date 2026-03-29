import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

type ActivationPayload = JwtPayload & {
  userId?: string;
  email?: string;
  purpose?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token : ''

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token de ativação ausente' })
  }

  const config = useRuntimeConfig()
  const activationSecret = config.activationTokenSecret

  if (!activationSecret) {
    throw createError({ statusCode: 500, statusMessage: 'ACTIVATION token secret não configurado' })
  }

  let decoded: ActivationPayload
  try {
    decoded = jwt.verify(token, activationSecret) as ActivationPayload
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Token de ativação inválido ou expirado' })
  }

  if (decoded.purpose !== 'account-activation' || !decoded.userId) {
    throw createError({ statusCode: 400, statusMessage: 'Token de ativação inválido' })
  }

  const prescriber = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, is_active: true },
  })

  if (!prescriber) {
    throw createError({ statusCode: 404, statusMessage: 'Prescritor não encontrado' })
  }

  const tokenEmail = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : ''
  const prescriberEmail = typeof prescriber.email === 'string' ? prescriber.email.trim().toLowerCase() : ''
  if (!tokenEmail || !prescriberEmail || tokenEmail !== prescriberEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Token de ativação inválido' })
  }

  if (!prescriber.is_active) {
    await prisma.user.update({
      where: { id: prescriber.id },
      data: { is_active: true },
    })
  }

  return {
    success: true,
    message: 'Conta ativada com sucesso. Agora você pode fazer login.',
  }
})

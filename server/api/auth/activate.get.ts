import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

type ActivationPayload = JwtPayload & {
  userId?: string;
  username?: string;
  purpose?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token : ''

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token de ativação ausente' })
  }

  const config = useRuntimeConfig(event)
  const activationSecret = config.activationTokenSecret || process.env.JWT_SECRET

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

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, is_active: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  if (!user.is_active) {
    await prisma.user.update({
      where: { id: user.id },
      data: { is_active: true },
    })
  }

  return {
    success: true,
    message: 'Conta ativada com sucesso. Agora você pode fazer login.',
  }
})

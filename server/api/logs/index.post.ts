import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)
  const body = await readBody(event)

  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Mensagem é obrigatória.' })
  }

  if (body.user_id !== undefined && body.user_id !== null && typeof body.user_id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'user_id inválido.' })
  }

  if (body.user_id !== undefined && body.user_id !== null && body.user_id !== actor.userId) {
    throw createError({ statusCode: 400, statusMessage: 'user_id deve corresponder ao usuário autenticado.' })
  }

  if (body.patient_id !== undefined && body.patient_id !== null && typeof body.patient_id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'patient_id inválido.' })
  }

  await prisma.log.create({
    data: {
      event_time: new Date(),
      message: body.message.trim(),
      user_id: actor.userId,
      patient_id: body.patient_id ?? null,
    }
  })
  
  return { success: true }
})
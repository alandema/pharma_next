import { logCreateBodySchema } from '../../utils/contractSchemas';
import { readStrictBody } from '../../utils/requestValidation';
import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)
  const body = await readStrictBody(event, logCreateBodySchema)

  if (body.message.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Mensagem é obrigatória.' })
  }

  if (body.user_id !== undefined && body.user_id !== null && body.user_id !== actor.userId) {
    throw createError({ statusCode: 400, statusMessage: 'user_id deve corresponder ao prescritor autenticado.' })
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
import { assertCanManageTargetRole, isKnownRole, requireAdminLikeUser } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const actor = requireAdminLikeUser(event)
  const adminId = actor.userId

  if (id === adminId) throw createError({ statusCode: 400, statusMessage: 'Não é possível excluir sua própria conta.' })

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

  if (!isKnownRole(user.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, user.role)

  // Transfer all patients managed by this user to the admin performing the deletion
  await prisma.patient.updateMany({
    where: { registered_by: id },
    data: { registered_by: adminId },
  })

  await prisma.user.delete({ where: { id } })

  return { success: true }
})

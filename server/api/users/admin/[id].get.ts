import { assertCanManageTargetRole, isKnownRole, requireAdminLikeUser, USER_SAFE_SELECT } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)

  const user = await prisma.user.findUnique({
    where: { id: event.context.params?.id },
    select: USER_SAFE_SELECT,
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuário não encontrado.',
    });
  }

  if (!isKnownRole(user.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, user.role)

  return {
    ...user,
    birth_date: user.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : null,
  };
})
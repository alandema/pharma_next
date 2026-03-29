import { assertCanManageTargetRole, isKnownRole, requireAdminLikeUser, PRESCRIBER_SAFE_SELECT } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event)

  const prescriber = await prisma.user.findUnique({
    where: { id: event.context.params?.id },
    select: PRESCRIBER_SAFE_SELECT,
  });

  if (!prescriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Prescritor não encontrado.',
    });
  }

  if (!isKnownRole(prescriber.role)) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração de papel de destino inválida.' })
  }

  assertCanManageTargetRole(actor.role, prescriber.role)

  return {
    ...prescriber,
    birth_date: prescriber.birth_date ? new Date(prescriber.birth_date).toISOString().split('T')[0] : null,
  };
})
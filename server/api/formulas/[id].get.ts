import { requireAuthenticatedUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAuthenticatedUser(event)

  const formula = await prisma.formulas.findUnique({
    where: {
      id: event.context.params?.id,
    },
  });

  if (!formula) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Fórmula não encontrada.',
    });
  }
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  };
})
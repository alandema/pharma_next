export default defineEventHandler(async (event) => {
  const formula = await prisma.formulas.findUnique({
    where: {
      id: event.context.params?.id,
    },
  });

  if (!formula) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Formula not found',
    });
  }
  return {
    id: formula.id,
    name: formula.name,
    information: formula.information,
  };
})
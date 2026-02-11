export default defineEventHandler(async (event) => {
  const user = await prisma.user.findUnique({
    where: {
      id: event.context.params?.id,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
})
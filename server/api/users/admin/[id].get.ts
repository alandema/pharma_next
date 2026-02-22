export default defineEventHandler(async (event) => {
  const user = await prisma.user.findUnique({
    where: { id: event.context.params?.id },
    select: { id: true, username: true, role: true, is_active: true },
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
    is_active: user.is_active,
  };
})
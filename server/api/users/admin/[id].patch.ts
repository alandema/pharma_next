export default defineEventHandler(async (event) => {
  const id = event.context.params?.id

  const user = await prisma.user.findUnique({ where: { id }, select: { is_active: true } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const updated = await prisma.user.update({
    where: { id },
    data: { is_active: !user.is_active },
    select: { id: true, username: true, role: true, is_active: true },
  })

  return updated
})

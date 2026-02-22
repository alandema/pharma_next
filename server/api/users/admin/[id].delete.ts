export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const adminId = event.context.user?.userId

  if (!adminId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (id === adminId) throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Transfer all patients managed by this user to the admin performing the deletion
  await prisma.patient.updateMany({
    where: { registered_by: id },
    data: { registered_by: adminId },
  })

  await prisma.user.delete({ where: { id } })

  return { success: true }
})

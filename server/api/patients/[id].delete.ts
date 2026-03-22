export default defineEventHandler(async (event) => {
  const user = event.context.user
  const where: any = { id: event.context.params?.id }
  if (user.role !== 'admin' && user.role !== 'superadmin') where.registered_by = user.userId

  const patient = await prisma.patient.findUnique({ where })
  if (!patient) throw createError({ statusCode: 404, statusMessage: 'Patient not found' })

  await prisma.patient.delete({ where: { id: patient.id } })
  await prisma.log.create({ data: { event_time: new Date(), message: `Deletou paciente: ${patient.name}`, user_id: user.userId } })
  return { success: true }
})

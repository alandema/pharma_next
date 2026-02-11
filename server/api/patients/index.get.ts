export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where = user.role === 'admin' ? {} : { registered_by: user.userId };

  const patients = await prisma.patients.findMany({
    where,
    select: { id: true, name: true, cpf: true , registered_by: true},
  });

  return patients;
})
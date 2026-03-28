export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const prescription = await prisma.prescription.findUnique({
    where: {
      id: event.context.params?.id,
    },
    include: {
      patient: true,
      user: {
        select: { id: true, username: true, full_name: true }
      }
    },
  });

  if (!prescription) return null;

  if (user.role !== 'admin' && user.role !== 'superadmin' && prescription.prescribed_by !== user.userId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Prescrição não encontrada.',
    });
  }
  
  return {
    ...prescription,
    date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10),
    patient: {
      ...prescription.patient,
      birth_date: prescription.patient.birth_date
        ? prescription.patient.birth_date.toISOString().slice(0, 10)
        : null,
    },
  };
});
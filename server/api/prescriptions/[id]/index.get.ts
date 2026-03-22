export default defineEventHandler(async (event) => {
  const user = event.context.user;

  const prescription = await prisma.prescription.findUnique({
    where: {
      id: event.context.params?.id,
    },
    include: {
      patient: true,
      user: {
        select: { id: true, username: true }
      }
    },
  });

  if (!prescription) return null;

  if (user.role !== 'admin' && user.role !== 'superadmin' && prescription.prescribed_by !== user.userId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Prescription not found',
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
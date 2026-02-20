export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where: any = { id: event.context.params?.id };
  if (user.role !== 'admin') {
    where.registered_by = user.userId;
  }

  const patient = await prisma.patient.findUnique({
    where,
    include: {
      prescriptions: true,
      user: { select: { id: true, username: true } },
    },
  });

  if (!patient) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Patient not found',
    });
  }
  return {
    id: patient.id,
    name: patient.name,
    rg: patient.rg,
    gender: patient.gender,
    cpf: patient.cpf,
    birth_date: patient.birth_date,
    phone: patient.phone,
    zipcode: patient.zipcode,
    street: patient.street,
    district: patient.district,
    house_number: patient.house_number,
    additional_info: patient.additional_info,
    country: patient.country,
    state: patient.state,
    city: patient.city,
    medical_history: patient.medical_history,
    registered_by: patient.registered_by,
    registered_by_username: patient.user?.username ?? null,
    prescriptions: patient.prescriptions,
  };
})
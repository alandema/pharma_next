export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where: any = { id: event.context.params?.id };
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    where.registered_by = user.userId;
  }

  const patient = await prisma.patient.findUnique({
    where,
    include: {
      prescriptions: {
        orderBy: { date_prescribed: 'desc' },
        take: 3,
      },
      user: { select: { id: true, email: true, full_name: true } },
    },
  });

  if (!patient) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paciente não encontrado.',
    });
  }
  return {
    id: patient.id,
    name: patient.name,
    rg: patient.rg,
    gender: patient.gender,
    cpf: patient.cpf,
    birth_date: patient.birth_date ? patient.birth_date.toISOString().slice(0, 10) : null,
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
    registered_by_full_name: patient.user?.full_name ?? null,
    prescriptions: patient.prescriptions.map((prescription) => ({
      ...prescription,
      date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10),
    })),
  };
})
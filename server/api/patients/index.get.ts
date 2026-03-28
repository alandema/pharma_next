export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const where = user.role === 'admin' || user.role === 'superadmin' ? {} : { registered_by: user.userId };

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: { id: true, name: true, cpf: true, user: { select: { username: true , full_name: true } } },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  // get last prescription date for each patient
  for (const patient of patients) {
    const lastPrescription = await prisma.prescription.findFirst({
      where: { patient_id: patient.id },
      orderBy: { date_prescribed: 'desc' },
      select: { date_prescribed: true },
    });
    (patient as any).last_prescription_date = lastPrescription ? lastPrescription.date_prescribed.toISOString().split('T')[0] : null;
  }


  return {
    data: patients,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
})
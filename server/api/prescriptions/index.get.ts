export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const pageRaw = query.page;
  if (typeof pageRaw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Parâmetro page é obrigatório.' });
  }

  const page = Number.parseInt(pageRaw, 10);
  if (!Number.isInteger(page) || page < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Parâmetro page inválido.' });
  }

  const limit = 10;
  const skip = (page - 1) * limit;
  const patientId = query.patientId as string | undefined;
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;
  const user = event.context.user;
  const datePrescribed = {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {})
  };

  const where = {
    ...(patientId ? { patient_id: patientId } : {}),
    ...(startDate || endDate ? { date_prescribed: datePrescribed } : {}),
    ...(user.role !== 'admin' && user.role !== 'superadmin' ? { prescribed_by: user.userId } : {})
  };

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date_prescribed: 'desc' },
      include: {
        patient: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, username: true }
        }
      }
    }),
    prisma.prescription.count({ where })
  ]);

  return {
    prescriptions: prescriptions.map((prescription) => ({
      ...prescription,
      date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10)
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
});
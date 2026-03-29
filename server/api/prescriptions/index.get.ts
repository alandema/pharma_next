import { buildPaginationMetadata, parsePagination } from '../../utils/pagination';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { page, limit, skip } = parsePagination(query as Record<string, unknown>, {
    defaultLimit: 10,
    maxLimit: 50,
  });
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
          select: { id: true, email: true, full_name: true}
        }
      }
    }),
    prisma.prescription.count({ where })
  ]);

  return {
    data: prescriptions.map((prescription) => ({
      ...prescription,
      date_prescribed: prescription.date_prescribed.toISOString().slice(0, 10)
    })),
    metadata: buildPaginationMetadata(total, page, limit),
  };
});
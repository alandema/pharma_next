import { buildPaginationMetadata, parsePagination } from '../../utils/pagination';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const query = getQuery(event);
  const { page, limit, skip } = parsePagination(query as Record<string, unknown>, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const where = user.role === 'admin' || user.role === 'superadmin' ? {} : { registered_by: user.userId };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: { id: true, name: true, cpf: true, user: { select: { email: true, full_name: true } } },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  const patientIds = patients.map((patient) => patient.id);
  const latestPrescriptions = patientIds.length
    ? await prisma.prescription.groupBy({
      by: ['patient_id'],
      where: { patient_id: { in: patientIds } },
      _max: { date_prescribed: true },
    })
    : [];

  const lastPrescriptionMap = new Map(
    latestPrescriptions.map((item) => [
      item.patient_id,
      item._max.date_prescribed ? item._max.date_prescribed.toISOString().slice(0, 10) : null,
    ]),
  );

  return {
    data: patients.map((patient) => ({
      ...patient,
      last_prescription_date: lastPrescriptionMap.get(patient.id) ?? null,
    })),
    metadata: buildPaginationMetadata(total, page, limit),
  };
})
import { requireAdminLikeUser } from '../../utils/rbac';

export default defineEventHandler(async (event) => {
  requireAdminLikeUser(event)

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (page - 1) * limit;
  const userId = query.userId as string | undefined;
  const patientId = query.patientId as string | undefined;
  const date = query.date as string | undefined;

  const where = {
    ...(userId ? { user_id: userId } : {}),
    ...(patientId ? { patient_id: patientId } : {}),
    ...(date ? { event_time: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { event_time: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        patient: { select: { id: true, name: true } },
      },
    }),
    prisma.log.count({ where }),
  ]);

  return {
    data: logs,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
})
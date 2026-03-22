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

  const limit = 20;
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

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
})
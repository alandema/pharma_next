export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [formulas, total] = await Promise.all([
    prisma.formulas.findMany({
      select: { id: true, name: true, information: true },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.formulas.count(),
  ]);

  return {
    data: formulas,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
})
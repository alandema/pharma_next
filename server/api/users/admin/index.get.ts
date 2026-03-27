export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, full_name: true, username: true, role: true, is_active: true },
      orderBy: { full_name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
})
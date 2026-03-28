import { isSuperadmin, requireAdminLikeUser } from '../../../utils/rbac';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event);
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const where = isSuperadmin(actor.role)
    ? { role: { in: ['user', 'admin'] } }
    : { role: 'user' };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, full_name: true, username: true, role: true, is_active: true },
      orderBy: { full_name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
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
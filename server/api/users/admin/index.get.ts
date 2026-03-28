import { isSuperadmin, requireAdminLikeUser } from '../../../utils/rbac';
import { buildPaginationMetadata, parsePagination } from '../../../utils/pagination';

export default defineEventHandler(async (event) => {
  const actor = requireAdminLikeUser(event);
  const query = getQuery(event);
  const { page, limit, skip } = parsePagination(query as Record<string, unknown>, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const roleParam = Array.isArray(query.role) ? query.role[0] : query.role;
  const requestedRole = roleParam === 'user' || roleParam === 'admin' ? roleParam : undefined;

  const where = isSuperadmin(actor.role)
    ? (requestedRole ? { role: requestedRole } : { role: { in: ['user', 'admin'] } })
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
    metadata: buildPaginationMetadata(total, page, limit),
  };
})
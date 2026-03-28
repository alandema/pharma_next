import { requireAuthenticatedUser } from '../../utils/rbac';
import { buildPaginationMetadata, parsePagination } from '../../utils/pagination';

export default defineEventHandler(async (event) => {
  requireAuthenticatedUser(event)

  const query = getQuery(event);
  const { page, limit, skip } = parsePagination(query as Record<string, unknown>, {
    defaultLimit: 10,
    maxLimit: 50,
  });

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
    metadata: buildPaginationMetadata(total, page, limit),
  };
})
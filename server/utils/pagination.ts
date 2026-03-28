type PaginationOptions = {
  defaultLimit: number;
  maxLimit?: number;
};

const firstQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export const parsePagination = (
  query: Record<string, unknown>,
  options: PaginationOptions,
) => {
  const maxLimit = options.maxLimit ?? 50;
  const defaultLimit = Math.min(maxLimit, Math.max(1, Math.trunc(options.defaultLimit)));

  const rawPage = Number(firstQueryValue(query.page));
  const rawLimit = Number(firstQueryValue(query.limit));

  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const requestedLimit = Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMetadata = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

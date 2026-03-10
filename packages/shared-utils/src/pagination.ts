import type { PaginationMeta } from '@collabcode/shared-types';

/** Pagination parameters from request query values. */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Parses pagination parameters from unknown query input.
 * @param query Query object containing page and limit values.
 * @returns Sanitized pagination parameters.
 */
export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20
  };
}

/**
 * Builds pagination metadata for uniform API responses.
 * @param page Current page number.
 * @param limit Current page size.
 * @param total Total item count.
 * @returns Pagination metadata object.
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

/** Pagination metadata envelope. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Canonical API error shape. */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Canonical API response shape. */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: PaginationMeta;
}

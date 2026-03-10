import type { ApiError, ApiResponse, PaginationMeta } from '@collabcode/shared-types';

/**
 * Builds a successful API response envelope.
 * @param data Response data payload.
 * @param meta Optional pagination metadata.
 * @returns Standardized API response with null error.
 */
export function success<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  const response: ApiResponse<T> = {
    data,
    error: null
  };

  if (meta !== undefined) {
    response.meta = meta;
  }

  return response;
}

/**
 * Builds a failed API response envelope.
 * @param code Stable machine-readable error code.
 * @param message Human-readable error message.
 * @param details Optional diagnostics payload.
 * @returns Standardized API response with null data.
 */
export function failure(code: string, message: string, details?: unknown): ApiResponse<null> {
  const error: ApiError = {
    code,
    message,
    details
  };

  return {
    data: null,
    error
  };
}

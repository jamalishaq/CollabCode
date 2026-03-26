import type { FastifyRequest } from 'fastify';

import { AppError } from '../utils/app-error';

export function getUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'];

  if (!userId || Array.isArray(userId)) {
    throw new AppError('Missing x-user-id header.', 401, 'UNAUTHORIZED');
  }

  return userId;
}

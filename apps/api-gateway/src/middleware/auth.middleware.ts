import type { FastifyRequest } from 'fastify';

import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/app-error';

const publicRoutes = new Set([
  'POST:/auth/register',
  'POST:/auth/login',
  'POST:/auth/refresh',
  'GET:/auth/github',
  'GET:/auth/github/callback',
  'GET:/auth/google',
  'GET:/auth/google/callback',
  'GET:/health'
]);

function routeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export async function authMiddleware(request: FastifyRequest): Promise<void> {
  const path = (request.raw.url ?? request.url).split('?')[0] ?? request.url;
  if (publicRoutes.has(routeKey(request.method, path))) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  const token = authHeader.substring('Bearer '.length);
  const payload = await AuthService.validate(token);

  request.headers['x-user-id'] = payload.sub;
  request.headers['x-user-email'] = payload.email;
}

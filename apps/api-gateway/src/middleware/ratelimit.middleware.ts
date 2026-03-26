import type { FastifyReply, FastifyRequest } from 'fastify';

import { RateLimitService } from '../services/ratelimit.service';
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

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = (request.raw.url ?? request.url).split('?')[0] ?? request.url;

  if (publicRoutes.has(routeKey(request.method, path))) {
    const ipResult = await RateLimitService.checkIp(request.ip);
    if (!ipResult.allowed) {
      reply.header('Retry-After', String(ipResult.retryAfterSeconds));
      throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again in 60 seconds.', {
        retryAfter: ipResult.retryAfterSeconds
      });
    }
    return;
  }

  const userId = request.headers['x-user-id'];
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  const userResult = await RateLimitService.checkUser(userId);
  if (!userResult.allowed) {
    reply.header('Retry-After', String(userResult.retryAfterSeconds));
    throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again in 60 seconds.', {
      retryAfter: userResult.retryAfterSeconds
    });
  }

  if (path === '/execute') {
    const executeResult = await RateLimitService.checkExecute(userId);
    if (!executeResult.allowed) {
      reply.header('Retry-After', String(executeResult.retryAfterSeconds));
      throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again in 60 seconds.', {
        retryAfter: executeResult.retryAfterSeconds
      });
    }
  }
}

import { failure } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Request user payload attached after JWT verification. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthenticatedUser;
  }
}

/**
 * Verifies bearer token and attaches user claims to request context.
 * @param request Fastify request.
 * @param reply Fastify reply.
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    reply.status(401).send(failure('UNAUTHENTICATED', 'Missing token'));
    return;
  }

  const token = authorization.replace('Bearer ', '').trim();
  try {
    const payload = request.server.jwt.verify<{ sub: string; email?: string }>(token);
    request.authUser = {
      userId: payload.sub,
      email: payload.email ?? ''
    };
  } catch {
    reply.status(401).send(failure('UNAUTHENTICATED', 'Invalid token'));
  }
}

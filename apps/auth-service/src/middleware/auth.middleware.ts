import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { config } from '../config';

/** Request user payload attached after JWT verification. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * Verifies bearer token and attaches user claims to request context.
 * @param request Fastify request.
 * @param reply Fastify reply.
 * @throws Error when token is missing or invalid.
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    reply.status(401).send({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Missing token' } });
    return;
  }

  const token = authorization.replace('Bearer ', '');
  try {
    jwt.verify(token, config.JWT_SECRET);
  } catch {
    reply.status(401).send({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Invalid token' } });
  }
}

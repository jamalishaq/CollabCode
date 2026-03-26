import { failure } from '@collabcode/shared-utils';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../utils/app-error';

/**
 * Handles all uncaught route and middleware errors uniformly.
 * @param error Error thrown by application code.
 * @param _request Fastify request.
 * @param reply Fastify reply.
 */
export function errorMiddleware(
  error: FastifyError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(failure(error.code, error.message, error.details));
    return;
  }

  reply.status(500).send(failure('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.'));
}

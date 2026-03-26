import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { failure } from '@collabcode/shared-utils';

import { AppError } from '../utils/app-error';

export function errorMiddleware(
  error: FastifyError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    const payload = failure(error.code, error.message, {
      statusCode: error.statusCode,
      ...(error.details !== undefined ? { ...((error.details as Record<string, unknown>) ?? {}) } : {})
    });
    reply.status(error.statusCode).send(payload);
    return;
  }

  reply.status(500).send(
    failure('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', {
      statusCode: 500
    })
  );
}

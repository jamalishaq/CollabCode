import { failure } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { ZodSchema } from 'zod';

/**
 * Creates a pre-handler that validates request payload data with Zod.
 * @param schema Zod schema to apply.
 * @returns Fastify pre-handler hook.
 */
export function validateMiddleware<T>(schema: ZodSchema<T>): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = schema.safeParse({
      body: request.body,
      query: request.query,
      params: request.params
    });

    if (!parsed.success) {
      return reply.status(422).send(
        failure('VALIDATION_ERROR', 'Request validation failed.', parsed.error.flatten())
      );
    }

    const data = parsed.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };

    if (data.body !== undefined) {
      request.body = data.body;
    }

    if (data.query !== undefined) {
      request.query = data.query;
    }

    if (data.params !== undefined) {
      request.params = data.params;
    }
  };
}

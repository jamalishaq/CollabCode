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
      reply.status(422).send(
        failure('VALIDATION_ERROR', 'Request validation failed.', parsed.error.flatten())
      );
    }
  };
}

import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';

/**
 * Wraps async handlers and forwards thrown errors to Fastify.
 * @param handler Route handler to wrap.
 * @returns Fastify-compatible route handler.
 */
export function catchAsync(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>
): RouteHandlerMethod {
  return async (request, reply) => {
    await handler(request, reply);
  };
}

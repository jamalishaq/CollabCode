import Fastify, { type FastifyInstance } from 'fastify';

import { errorMiddleware } from './middleware/error.middleware';
import { registerRoutes } from './routes';

/**
 * Creates and configures a Fastify app instance.
 * @returns Configured Fastify app.
 */
export function createApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
  });

  app.setErrorHandler(errorMiddleware);
  void registerRoutes(app);

  return app;
}

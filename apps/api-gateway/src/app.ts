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
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
  });

  app.setErrorHandler(errorMiddleware);
  void registerRoutes(app);
  return app;
}

import Fastify, { type FastifyInstance } from 'fastify';

import { errorMiddleware } from './middleware/error.middleware';
import { registerRoutes } from './routes';

/**
 * Creates and configures a Fastify app instance.
 * @returns Configured Fastify app.
 */
export function createApp(): FastifyInstance {
  const app = Fastify({ logger: true, trustProxy: true });

  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    const rawBody = body.toString();
    (request as { rawBody?: string }).rawBody = rawBody;

    if (rawBody.length === 0) {
      done(null, {});
      return;
    }

    try {
      done(null, JSON.parse(rawBody));
    } catch (error) {
      done(error as Error);
    }
  });

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
  });

  app.setErrorHandler(errorMiddleware);
  void registerRoutes(app);

  return app;
}

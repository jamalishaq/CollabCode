import Fastify, { type FastifyInstance } from 'fastify';

import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimitMiddleware } from './middleware/ratelimit.middleware';
import { registerRoutes } from './routes';

export function createApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.addHook('onRequest', async (request, reply) => {
    if (config.FRONTEND_ORIGIN) {
      reply.header('Access-Control-Allow-Origin', config.FRONTEND_ORIGIN);
      reply.header('Vary', 'Origin');
    }
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self'");

    request.log.info({ method: request.method, path: request.url }, 'request received');
  });

  app.options('/*', async (_request, reply) => {
    reply.status(204).send();
  });

  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', rateLimitMiddleware);

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({ method: request.method, path: request.url, statusCode: reply.statusCode }, 'request completed');
  });

  app.setErrorHandler(errorMiddleware);
  void registerRoutes(app);
  return app;
}

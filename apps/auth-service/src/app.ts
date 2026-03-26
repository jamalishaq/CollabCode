import jwt from '@fastify/jwt';
import Fastify, { type FastifyInstance } from 'fastify';

import { config } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import { registerRoutes } from './routes';

/**
 * Creates and configures a Fastify app instance.
 */
export function createApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  void app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      algorithm: 'HS256'
    }
  });

  app.setErrorHandler(errorMiddleware);
  void app.register(async (instance) => {
    await registerRoutes(instance);
  });

  return app;
}

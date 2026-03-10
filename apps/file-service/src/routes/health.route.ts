import type { FastifyInstance } from 'fastify';

/**
 * Registers health route handlers.
 * @param app Fastify instance.
 */
export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    data: {
      status: 'ok',
      uptime: process.uptime()
    },
    error: null
  }));
}

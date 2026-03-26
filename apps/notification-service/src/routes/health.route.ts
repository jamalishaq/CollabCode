import { success } from '@collabcode/shared-utils';
import type { FastifyInstance } from 'fastify';

/**
 * Registers health route handlers.
 * @param app Fastify instance.
 */
export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () =>
    success({
      status: 'ok',
      uptime: process.uptime()
    })
  );
}

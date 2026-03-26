import { LOCK_TTL_SECONDS } from '@collabcode/shared-config';
import { success } from '@collabcode/shared-utils';
import type { FastifyInstance } from 'fastify';

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () =>
    success({
      status: 'ok',
      uptime: process.uptime(),
      defaults: {
        lockTtlSeconds: LOCK_TTL_SECONDS
      }
    })
  );
}

import type { FastifyInstance } from 'fastify';

import { HealthController } from '../controllers/health.controller';

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', HealthController.check);
}

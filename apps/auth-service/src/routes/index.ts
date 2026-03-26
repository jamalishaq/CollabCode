import type { FastifyInstance } from 'fastify';

import { authRoute } from './auth.route';
import { healthRoute } from './health.route';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await healthRoute(app);
  await authRoute(app);
}

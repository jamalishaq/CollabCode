import type { FastifyInstance } from 'fastify';

import { healthRoute } from './health.route';
import { notificationRoute } from './notification.route';

/**
 * Registers all API route modules.
 * @param app Fastify instance.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await healthRoute(app);
  await notificationRoute(app);
}

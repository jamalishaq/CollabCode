import type { FastifyInstance } from 'fastify';

import { fileRoute } from './file.route';
import { healthRoute } from './health.route';

/**
 * Registers all API route modules.
 * @param app Fastify instance.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await healthRoute(app);
  await fileRoute(app);
}

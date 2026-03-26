import type { FastifyInstance } from 'fastify';

import { healthRoute } from './health.route';
import { workspaceRoute } from './workspace.route';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await healthRoute(app);
  await workspaceRoute(app);
}

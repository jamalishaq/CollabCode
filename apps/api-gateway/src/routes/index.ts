import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { healthRoute } from './health.route';
import { ProxyService } from '../services/proxy.service';

async function proxyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const forwardedHeaders: Record<string, string> = {};
  const userId = request.headers['x-user-id'];
  const userEmail = request.headers['x-user-email'];

  if (typeof userId === 'string') {
    forwardedHeaders['x-user-id'] = userId;
  }

  if (typeof userEmail === 'string') {
    forwardedHeaders['x-user-email'] = userEmail;
  }

  const response = await ProxyService.forward(request, forwardedHeaders);
  const text = await response.text();

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'transfer-encoding') {
      continue;
    }
    reply.header(key, value);
  }

  let payload: unknown = text;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  reply.status(response.status).send(payload);
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await healthRoute(app);

  app.route({ method: ['GET', 'POST'], url: '/auth/*', handler: proxyHandler });
  app.route({ method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], url: '/workspaces/*', handler: proxyHandler });
  app.route({ method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], url: '/projects/*', handler: proxyHandler });
  app.post('/execute', proxyHandler);

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        statusCode: 404
      }
    });
  });
}

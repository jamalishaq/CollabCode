import type { FastifyInstance } from 'fastify';

import {
  loginHandler,
  logoutHandler,
  meHandler,
  oauthPlaceholderHandler,
  refreshHandler,
  registerHandler,
  validateHandler
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { loginSchema, logoutSchema, refreshSchema, registerSchema, validateSchema } from '../schemas/auth.schema';

export async function authRoute(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', { preHandler: validateMiddleware(registerSchema) }, registerHandler);
  app.post('/auth/login', { preHandler: validateMiddleware(loginSchema) }, loginHandler);
  app.post('/auth/refresh', { preHandler: validateMiddleware(refreshSchema) }, refreshHandler);
  app.post('/auth/logout', { preHandler: validateMiddleware(logoutSchema) }, logoutHandler);
  app.get('/auth/me', { preHandler: authMiddleware }, meHandler);
  app.post('/auth/validate', { preHandler: validateMiddleware(validateSchema) }, validateHandler);

  app.get('/auth/github', oauthPlaceholderHandler);
  app.get('/auth/github/callback', oauthPlaceholderHandler);
  app.get('/auth/google', oauthPlaceholderHandler);
  app.get('/auth/google/callback', oauthPlaceholderHandler);
}

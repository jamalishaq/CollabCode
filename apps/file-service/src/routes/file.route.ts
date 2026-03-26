import type { FastifyInstance } from 'fastify';

import {
  acquireLockHandler,
  createFileHandler,
  deleteFileHandler,
  getFileHandler,
  listFilesHandler,
  releaseLockHandler,
  renewLockHandler,
  updateFileHandler
} from '../controllers/file.controller';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createFileSchema, fileParamsSchema, patchFileSchema, projectParamsSchema } from '../schemas/file.schema';

export async function fileRoute(app: FastifyInstance): Promise<void> {
  app.post('/projects/:projectId/files', { preHandler: validateMiddleware(createFileSchema) }, createFileHandler);
  app.get('/projects/:projectId/files', { preHandler: validateMiddleware(projectParamsSchema) }, listFilesHandler);
  app.get('/projects/:projectId/files/:fileId', { preHandler: validateMiddleware(fileParamsSchema) }, getFileHandler);
  app.patch('/projects/:projectId/files/:fileId', { preHandler: validateMiddleware(patchFileSchema) }, updateFileHandler);
  app.delete('/projects/:projectId/files/:fileId', { preHandler: validateMiddleware(fileParamsSchema) }, deleteFileHandler);

  app.post('/projects/:projectId/files/:fileId/lock', { preHandler: validateMiddleware(fileParamsSchema) }, acquireLockHandler);
  app.delete('/projects/:projectId/files/:fileId/lock', { preHandler: validateMiddleware(fileParamsSchema) }, releaseLockHandler);
  app.post('/projects/:projectId/files/:fileId/lock/renew', { preHandler: validateMiddleware(fileParamsSchema) }, renewLockHandler);
}

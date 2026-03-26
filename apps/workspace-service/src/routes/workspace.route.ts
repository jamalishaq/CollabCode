import type { FastifyInstance } from 'fastify';

import {
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspacesHandler,
  updateWorkspaceHandler
} from '../controllers/workspace.controller';
import { validateMiddleware } from '../middleware/validate.middleware';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  projectParamsSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  updateProjectSchema,
  updateWorkspaceSchema,
  workspaceParamsSchema,
  createProjectSchema
} from '../schemas/workspace.schema';
import {
  inviteMemberHandler,
  removeMemberHandler,
  updateMemberRoleHandler
} from '../controllers/member.controller';
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler
} from '../controllers/project.controller';

export async function workspaceRoute(app: FastifyInstance): Promise<void> {
  app.post('/workspaces', { preHandler: validateMiddleware(createWorkspaceSchema) }, createWorkspaceHandler);
  app.get('/workspaces', listWorkspacesHandler);
  app.get('/workspaces/:workspaceId', { preHandler: validateMiddleware(workspaceParamsSchema) }, getWorkspaceHandler);
  app.patch('/workspaces/:workspaceId', { preHandler: validateMiddleware(updateWorkspaceSchema) }, updateWorkspaceHandler);
  app.delete('/workspaces/:workspaceId', { preHandler: validateMiddleware(workspaceParamsSchema) }, deleteWorkspaceHandler);

  app.post('/workspaces/:workspaceId/members', { preHandler: validateMiddleware(inviteMemberSchema) }, inviteMemberHandler);
  app.patch('/workspaces/:workspaceId/members/:userId', { preHandler: validateMiddleware(updateMemberRoleSchema) }, updateMemberRoleHandler);
  app.delete('/workspaces/:workspaceId/members/:userId', { preHandler: validateMiddleware(removeMemberSchema) }, removeMemberHandler);

  app.post('/workspaces/:workspaceId/projects', { preHandler: validateMiddleware(createProjectSchema) }, createProjectHandler);
  app.get('/workspaces/:workspaceId/projects', { preHandler: validateMiddleware(workspaceParamsSchema) }, listProjectsHandler);
  app.get('/workspaces/:workspaceId/projects/:projectId', { preHandler: validateMiddleware(projectParamsSchema) }, getProjectHandler);
  app.patch('/workspaces/:workspaceId/projects/:projectId', { preHandler: validateMiddleware(updateProjectSchema) }, updateProjectHandler);
  app.delete('/workspaces/:workspaceId/projects/:projectId', { preHandler: validateMiddleware(projectParamsSchema) }, deleteProjectHandler);
}

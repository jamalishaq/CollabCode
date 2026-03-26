import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { getUserId } from '../middleware/auth.middleware';
import {
  createProjectService,
  deleteProjectService,
  getProjectService,
  listProjectsService,
  updateProjectService
} from '../services/project.service';

interface WorkspaceParams {
  workspaceId: string;
}

interface ProjectParams extends WorkspaceParams {
  projectId: string;
}

interface CreateProjectBody {
  name: string;
}

export async function createProjectHandler(
  request: FastifyRequest<{ Params: WorkspaceParams; Body: CreateProjectBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const project = await createProjectService(request.params.workspaceId, userId, request.body.name);

  reply.status(201).send(
    success({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      createdAt: project.createdAt
    })
  );
}

export async function listProjectsHandler(
  request: FastifyRequest<{ Params: WorkspaceParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const projects = await listProjectsService(request.params.workspaceId, userId);

  reply.send(
    success({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt
      }))
    })
  );
}

export async function getProjectHandler(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const project = await getProjectService(request.params.workspaceId, userId, request.params.projectId);

  reply.send(
    success({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })
  );
}

export async function updateProjectHandler(
  request: FastifyRequest<{ Params: ProjectParams; Body: CreateProjectBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const project = await updateProjectService(
    request.params.workspaceId,
    userId,
    request.params.projectId,
    request.body.name
  );

  reply.send(
    success({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      updatedAt: project.updatedAt
    })
  );
}

export async function deleteProjectHandler(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  await deleteProjectService(request.params.workspaceId, userId, request.params.projectId);

  reply.send(success({ success: true }));
}

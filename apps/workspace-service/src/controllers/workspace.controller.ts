import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { getUserId } from '../middleware/auth.middleware';
import {
  createWorkspaceService,
  deleteWorkspaceService,
  getWorkspaceService,
  listWorkspacesService,
  updateWorkspaceService
} from '../services/workspace.service';

interface WorkspaceParams {
  workspaceId: string;
}

interface CreateWorkspaceBody {
  name: string;
  description?: string;
}

interface UpdateWorkspaceBody {
  name?: string;
  description?: string;
}

export async function createWorkspaceHandler(
  request: FastifyRequest<{ Body: CreateWorkspaceBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const workspace = await createWorkspaceService(request.body, userId);

  reply.status(201).send(
    success({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt
    })
  );
}

export async function listWorkspacesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = getUserId(request);
  const workspaces = await listWorkspacesService(userId);

  reply.send(
    success({
      workspaces: workspaces.map((item: { workspace: { id: string; name: string }; role: string; memberCount: number }) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        role: item.role,
        memberCount: item.memberCount
      }))
    })
  );
}

export async function getWorkspaceHandler(
  request: FastifyRequest<{ Params: WorkspaceParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const { workspace, members } = await getWorkspaceService(request.params.workspaceId, userId);

  reply.send(
    success({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      members: members.map((member: { userId: string; role: string }) => ({
        userId: member.userId,
        role: member.role
      })),
      createdAt: workspace.createdAt
    })
  );
}

export async function updateWorkspaceHandler(
  request: FastifyRequest<{ Params: WorkspaceParams; Body: UpdateWorkspaceBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const workspace = await updateWorkspaceService(request.params.workspaceId, userId, request.body);

  reply.send(
    success({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description
    })
  );
}

export async function deleteWorkspaceHandler(
  request: FastifyRequest<{ Params: WorkspaceParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  await deleteWorkspaceService(request.params.workspaceId, userId);

  reply.send(success({ success: true }));
}

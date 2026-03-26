import { WorkspaceRole } from '@collabcode/shared-types';

import { publishWorkspaceEvent } from '../events/producer';
import { listMembers } from '../repositories/member.repository';
import {
  createWorkspace,
  deleteWorkspace,
  findWorkspaceById,
  listWorkspacesForUser,
  updateWorkspace
} from '../repositories/workspace.repository';
import { AppError } from '../utils/app-error';
import { requireMembership, requireRole } from './authorization.service';

export async function createWorkspaceService(input: { name: string; description?: string }, ownerId: string) {
  const workspace = await createWorkspace({ ...input, ownerId });

  await publishWorkspaceEvent('workspace.created', {
    type: 'workspace.created',
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    ownerId,
    timestamp: new Date().toISOString()
  });

  return workspace;
}

export async function listWorkspacesService(userId: string) {
  return listWorkspacesForUser(userId);
}

export async function getWorkspaceService(workspaceId: string, userId: string) {
  await requireMembership(workspaceId, userId);

  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found.', 404, 'NOT_FOUND');
  }

  const members = await listMembers(workspaceId);
  return { workspace, members };
}

export async function updateWorkspaceService(
  workspaceId: string,
  userId: string,
  input: { name?: string; description?: string }
) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner]);

  return updateWorkspace(workspaceId, {
    name: input.name,
    description: input.description
  });
}

export async function deleteWorkspaceService(workspaceId: string, userId: string) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner]);
  await deleteWorkspace(workspaceId);
}

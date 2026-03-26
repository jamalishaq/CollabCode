import { WorkspaceRole } from '@collabcode/shared-types';

import {
  createProject,
  deleteProject,
  findProject,
  listProjects,
  updateProject
} from '../repositories/project.repository';
import { AppError } from '../utils/app-error';
import { requireMembership, requireRole } from './authorization.service';

export async function createProjectService(workspaceId: string, userId: string, name: string) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner, WorkspaceRole.Editor]);
  return createProject(workspaceId, name);
}

export async function listProjectsService(workspaceId: string, userId: string) {
  await requireMembership(workspaceId, userId);
  return listProjects(workspaceId);
}

export async function getProjectService(workspaceId: string, userId: string, projectId: string) {
  await requireMembership(workspaceId, userId);
  const project = await findProject(workspaceId, projectId);

  if (!project) {
    throw new AppError('Project not found.', 404, 'NOT_FOUND');
  }

  return project;
}

export async function updateProjectService(
  workspaceId: string,
  userId: string,
  projectId: string,
  name: string
) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner, WorkspaceRole.Editor]);

  const existing = await findProject(workspaceId, projectId);
  if (!existing) {
    throw new AppError('Project not found.', 404, 'NOT_FOUND');
  }

  return updateProject(workspaceId, projectId, name);
}

export async function deleteProjectService(workspaceId: string, userId: string, projectId: string) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner]);

  const existing = await findProject(workspaceId, projectId);
  if (!existing) {
    throw new AppError('Project not found.', 404, 'NOT_FOUND');
  }

  await deleteProject(workspaceId, projectId);
}

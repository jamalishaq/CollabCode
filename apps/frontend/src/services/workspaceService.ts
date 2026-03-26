import { buildPaginationMeta, success } from '@collabcode/shared-utils';
import type { ApiResponse, Project, Workspace } from '@collabcode/shared-types';

import { mockProjects, mockWorkspaces } from './mockData';
import { apiClient } from '../utils/api-client';

/** listWorkspaces fetches available workspaces. */
export async function listWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data;
  } catch {
    return { ...success(mockWorkspaces), meta: buildPaginationMeta(1, mockWorkspaces.length, mockWorkspaces.length) };
  }
}

/** getWorkspaceById fetches one workspace. */
export async function getWorkspaceById(workspaceId: string): Promise<ApiResponse<Workspace>> {
  const workspace = mockWorkspaces.find((entry) => entry.id === workspaceId) ?? mockWorkspaces[0];
  return success(workspace);
}

/** listProjects fetches projects for a workspace. */
export async function listProjects(workspaceId: string): Promise<ApiResponse<Project[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Project[]>>(`/workspaces/${workspaceId}/projects`);
    return response.data;
  } catch {
    const projects = mockProjects.filter((entry) => entry.workspaceId === workspaceId);
    return success(projects);
  }
}

/** getProjectById fetches a single project. */
export async function getProjectById(projectId: string): Promise<ApiResponse<Project>> {
  const project = mockProjects.find((entry) => entry.id === projectId) ?? mockProjects[0];
  return success(project);
}

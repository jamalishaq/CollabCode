import type { ApiResponse, Project, Workspace } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';

/** listWorkspaces fetches available workspaces. */
export async function listWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  const response = await apiClient.get<ApiResponse<Workspace[]>>('/workspaces');
  return response.data;
}

/** listProjects fetches projects for a workspace. */
export async function listProjects(workspaceId: string): Promise<ApiResponse<Project[]>> {
  const response = await apiClient.get<ApiResponse<Project[]>>(`/workspaces/${workspaceId}/projects`);
  return response.data;
}

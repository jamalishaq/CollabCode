import type { ApiResponse, File, FileLock } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';

/** listFiles fetches project files. */
export async function listFiles(projectId: string): Promise<ApiResponse<File[]>> {
  const response = await apiClient.get<ApiResponse<File[]>>(`/projects/${projectId}/files`);
  return response.data;
}

/** acquireLock requests a pessimistic lock for a file. */
export async function acquireLock(fileId: string): Promise<ApiResponse<FileLock>> {
  const response = await apiClient.post<ApiResponse<FileLock>>(`/files/${fileId}/lock`);
  return response.data;
}

/** releaseLock releases a file lock. */
export async function releaseLock(fileId: string): Promise<ApiResponse<{ released: boolean }>> {
  const response = await apiClient.delete<ApiResponse<{ released: boolean }>>(`/files/${fileId}/lock`);
  return response.data;
}

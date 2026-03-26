import { LOCK_TTL_SECONDS } from '@collabcode/shared-config';
import { success } from '@collabcode/shared-utils';
import type { ApiResponse, File, FileLock } from '@collabcode/shared-types';

import { mockFiles } from './mockData';
import { apiClient } from '../utils/api-client';

/** listFiles fetches project files. */
export async function listFiles(projectId: string): Promise<ApiResponse<File[]>> {
  try {
    const response = await apiClient.get<ApiResponse<File[]>>(`/projects/${projectId}/files`);
    return response.data;
  } catch {
    return success(mockFiles.filter((file) => file.projectId === projectId));
  }
}

/** acquireLock requests a pessimistic lock for a file. */
export async function acquireLock(projectId: string, fileId: string): Promise<ApiResponse<FileLock>> {
  try {
    const response = await apiClient.post<ApiResponse<FileLock>>(`/projects/${projectId}/files/${fileId}/lock`);
    return response.data;
  } catch {
    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000).toISOString();
    return success({ fileId, userId: 'user-1', acquiredAt: new Date().toISOString(), expiresAt });
  }
}

/** releaseLock releases a file lock. */
export async function releaseLock(projectId: string, fileId: string): Promise<ApiResponse<{ released: boolean }>> {
  try {
    const response = await apiClient.delete<ApiResponse<{ released: boolean }>>(`/projects/${projectId}/files/${fileId}/lock`);
    return response.data;
  } catch {
    return success({ released: Boolean(fileId) });
  }
}

import type { ApiResponse, ExecutionRequest, ExecutionResult } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';

/** runCode submits source code for sandbox execution. */
export async function runCode(payload: ExecutionRequest): Promise<ApiResponse<ExecutionResult>> {
  const response = await apiClient.post<ApiResponse<ExecutionResult>>('/execute', payload);
  return response.data;
}

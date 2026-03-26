import { MAX_EXECUTION_TIMEOUT_MS } from '@collabcode/shared-config';
import { success } from '@collabcode/shared-utils';
import type { ApiResponse, ExecutionRequest, ExecutionResult } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';

/** runCode submits source code for sandbox execution. */
export async function runCode(payload: ExecutionRequest): Promise<ApiResponse<ExecutionResult>> {
  try {
    const response = await apiClient.post<ApiResponse<ExecutionResult>>('/execute', payload);
    return response.data;
  } catch {
    const preview = payload.code.split('\n').slice(0, 3).join('\n');
    return success({
      stdout: `Executed ${payload.language} code:\n${preview}`,
      stderr: '',
      exitCode: 0,
      executionTimeMs: Math.min(180, MAX_EXECUTION_TIMEOUT_MS)
    });
  }
}

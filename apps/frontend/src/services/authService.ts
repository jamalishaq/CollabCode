import type { ApiResponse, LoginRequest, RegisterRequest, User } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';

/** login performs user authentication. */
export async function login(payload: LoginRequest): Promise<ApiResponse<User>> {
  const response = await apiClient.post<ApiResponse<User>>('/auth/login', payload);
  return response.data;
}

/** register creates a new user account. */
export async function register(payload: RegisterRequest): Promise<ApiResponse<User>> {
  const response = await apiClient.post<ApiResponse<User>>('/auth/register', payload);
  return response.data;
}

/** refresh refreshes the active session token. */
export async function refresh(): Promise<ApiResponse<{ refreshed: boolean }>> {
  const response = await apiClient.post<ApiResponse<{ refreshed: boolean }>>('/auth/refresh');
  return response.data;
}

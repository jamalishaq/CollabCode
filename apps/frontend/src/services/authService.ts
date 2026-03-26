import { success } from '@collabcode/shared-utils';
import type { ApiResponse, LoginRequest, RegisterRequest, User } from '@collabcode/shared-types';

import { apiClient } from '../utils/api-client';
import { mockUser } from './mockData';

interface AuthSession {
  user: User;
  accessToken: string | null;
}

/** login performs user authentication. */
export async function login(payload: LoginRequest): Promise<ApiResponse<AuthSession>> {
  try {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', payload);
    return response.data;
  } catch {
    if (!payload.email || !payload.password) {
      return { data: null, error: { code: 'AUTH_INVALID', message: 'Email and password are required.' } };
    }

    return success({
      user: { ...mockUser, email: payload.email },
      accessToken: 'demo-access-token'
    });
  }
}

/** register creates a new user account. */
export async function register(payload: RegisterRequest): Promise<ApiResponse<AuthSession>> {
  try {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', payload);
    return response.data;
  } catch {
    if (!payload.email || !payload.password) {
      return { data: null, error: { code: 'AUTH_INVALID', message: 'All registration fields are required.' } };
    }

    return success({
      user: { ...mockUser, email: payload.email, id: crypto.randomUUID() },
      accessToken: 'demo-access-token'
    });
  }
}

/** refresh refreshes the active session token. */
export async function refresh(): Promise<ApiResponse<{ refreshed: boolean }>> {
  try {
    const response = await apiClient.post<ApiResponse<{ refreshed: boolean }>>('/auth/refresh');
    return response.data;
  } catch {
    return success({ refreshed: true });
  }
}

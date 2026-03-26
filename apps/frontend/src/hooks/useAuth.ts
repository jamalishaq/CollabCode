import type { LoginRequest, RegisterRequest } from '@collabcode/shared-types';
import { useState } from 'react';

import { login as loginRequest, register as registerRequest } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

interface UseAuthResult {
  statusMessage: string;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

/** useAuth provides auth command helpers. */
export function useAuth(): UseAuthResult {
  const [statusMessage, setStatusMessage] = useState('Ready');
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const login = async (payload: LoginRequest) => {
    const response = await loginRequest(payload);
    if (response.data) {
      setSession({ user: response.data.user, accessToken: response.data.accessToken });
      setStatusMessage(`Welcome back, ${response.data.user.email}`);
      return;
    }

    setStatusMessage(response.error?.message ?? 'Unable to login');
  };

  const register = async (payload: RegisterRequest) => {
    const response = await registerRequest(payload);
    if (response.data) {
      setSession({ user: response.data.user, accessToken: response.data.accessToken });
      setStatusMessage('Account created successfully');
      return;
    }

    setStatusMessage(response.error?.message ?? 'Unable to register');
  };

  return {
    login,
    register,
    logout: clearSession,
    statusMessage
  };
}

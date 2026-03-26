import axios from 'axios';

import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';

/** apiClient is the shared axios instance for frontend requests. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true
});

apiClient.interceptors.request.use((request) => {
  request.headers['X-Correlation-ID'] = crypto.randomUUID();

  const token = useAuthStore.getState().accessToken;
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

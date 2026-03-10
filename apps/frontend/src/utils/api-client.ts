import axios from 'axios';

/** apiClient is the shared axios instance for frontend requests. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});

apiClient.interceptors.request.use((request) => {
  request.headers['X-Correlation-ID'] = crypto.randomUUID();
  return request;
});

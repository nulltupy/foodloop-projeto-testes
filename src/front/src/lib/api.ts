import { api as lib } from '@foodloop/lib';

export const apiClient = lib.createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3010',
  getToken: () => localStorage.getItem('foodloop:token'),
  onUnauthorized: () => {
    localStorage.removeItem('foodloop:token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

lib.setApiClient(apiClient);

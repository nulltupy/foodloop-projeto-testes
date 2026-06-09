import { api as lib } from '@foodloop/lib';

// Com MSW ligado, as chamadas precisam ser same-origin para o service worker
// interceptá-las; por isso o baseUrl fica vazio (relativo à página).
const usaMsw = import.meta.env.VITE_USE_MSW === 'true';

export const apiClient = lib.createApiClient({
  baseUrl: usaMsw ? '' : (import.meta.env.VITE_API_URL ?? 'http://localhost:3010'),
  getToken: () => localStorage.getItem('foodloop:token'),
  onUnauthorized: () => {
    localStorage.removeItem('foodloop:token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

lib.setApiClient(apiClient);

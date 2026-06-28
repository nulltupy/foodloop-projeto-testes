import { api as lib } from '@foodloop/lib';
import { useAuthStore } from '../features/auth/store';

// Com MSW ligado, as chamadas precisam ser same-origin para o service worker
// interceptá-las; por isso o baseUrl fica vazio (relativo à página).
const usaMsw = import.meta.env.VITE_USE_MSW === 'true';

function rotaPublicaAuth(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/cadastro/');
}

function tokenAtual(): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem('foodloop:token');
}

export const apiClient = lib.createApiClient({
  baseUrl: usaMsw ? '' : (import.meta.env.VITE_API_URL ?? 'http://localhost:3010'),
  getToken: tokenAtual,
  onUnauthorized: () => {
    useAuthStore.getState().limpar();
    if (!rotaPublicaAuth(window.location.pathname)) {
      window.location.href = '/login';
    }
  },
});

lib.setApiClient(apiClient);

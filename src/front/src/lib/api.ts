import { api as lib } from '@foodloop/lib';
import { useAuthStore } from '../features/auth/store';

function rotaPublicaAuth(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/cadastro/');
}

function tokenAtual(): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem('foodloop:token');
}

export const apiClient = lib.createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3010',
  getToken: tokenAtual,
  onUnauthorized: () => {
    useAuthStore.getState().limpar();
    if (!rotaPublicaAuth(window.location.pathname)) {
      window.location.href = '/login';
    }
  },
});

lib.setApiClient(apiClient);

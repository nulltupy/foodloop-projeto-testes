import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@foodloop/lib';

// Usuário autenticado conforme o contrato de /auth (sem dados sensíveis).
export type UsuarioAutenticado = AuthResponse['usuario'];

// Chave lida pelo api client (@foodloop/lib) ao montar o header Authorization.
const CHAVE_TOKEN = 'foodloop:token';

interface AuthState {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  setSession: (usuario: UsuarioAutenticado, token: string) => void;
  limpar: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      setSession: (usuario, token) => {
        // Espelha o token na chave que o api client lê a cada requisição.
        localStorage.setItem(CHAVE_TOKEN, token);
        set({ usuario, token });
      },
      limpar: () => {
        localStorage.removeItem(CHAVE_TOKEN);
        set({ usuario: null, token: null });
      },
    }),
    {
      name: 'foodloop:auth',
      // Após o reload, re-sincroniza o token espelhado para o api client.
      onRehydrateStorage: () => (state) => {
        if (state?.token) localStorage.setItem(CHAVE_TOKEN, state.token);
      },
    },
  ),
);

import { create } from 'zustand';
import { persist, type PersistStorage, type StateStorage, type StorageValue } from 'zustand/middleware';
import type { AuthResponse } from '@foodloop/lib';

// Usuário autenticado conforme o contrato de /auth (sem dados sensíveis).
export type UsuarioAutenticado = AuthResponse['usuario'];

// Chave lida pelo api client (@foodloop/lib) ao montar o header Authorization.
const CHAVE_TOKEN = 'foodloop:token';
const memoriaStorage = new Map<string, string>();

function storageAuth(): StateStorage {
  if (typeof localStorage !== 'undefined') return localStorage;
  return {
    getItem: (key) => memoriaStorage.get(key) ?? null,
    removeItem: (key) => {
      memoriaStorage.delete(key);
    },
    setItem: (key, value) => {
      memoriaStorage.set(key, value);
    },
  };
}

interface AuthState {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  setSession: (usuario: UsuarioAutenticado, token: string) => void;
  limpar: () => void;
}

const persistStorage: PersistStorage<AuthState> = {
  getItem: (key) => {
    const valor = storageAuth().getItem(key);
    if (valor instanceof Promise) {
      return valor.then((v) => (v ? (JSON.parse(v) as StorageValue<AuthState>) : null));
    }
    return valor ? (JSON.parse(valor) as StorageValue<AuthState>) : null;
  },
  removeItem: (key) => storageAuth().removeItem(key),
  setItem: (key, value) => storageAuth().setItem(key, JSON.stringify(value)),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      setSession: (usuario, token) => {
        // Espelha o token na chave que o api client lê a cada requisição.
        storageAuth().setItem(CHAVE_TOKEN, token);
        set({ usuario, token });
      },
      limpar: () => {
        storageAuth().removeItem(CHAVE_TOKEN);
        set({ usuario: null, token: null });
      },
    }),
    {
      name: 'foodloop:auth',
      storage: persistStorage,
      // Após o reload, re-sincroniza o token espelhado para o api client.
      onRehydrateStorage: () => (state) => {
        if (state?.token) storageAuth().setItem(CHAVE_TOKEN, state.token);
      },
    },
  ),
);

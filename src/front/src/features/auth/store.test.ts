import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './store';

const cliente = { id: 1, nome: 'Maria Silva', email: 'maria@foodloop.dev', tipo: 'cliente' as const };

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('useAuthStore', () => {
  it('setSession guarda o usuário e espelha o token em foodloop:token', () => {
    useAuthStore.getState().setSession(cliente, 'tok-123');
    expect(useAuthStore.getState().usuario).toEqual(cliente);
    expect(localStorage.getItem('foodloop:token')).toBe('tok-123');
  });

  it('persiste a sessão em foodloop:auth (sobrevive ao reload)', () => {
    useAuthStore.getState().setSession(cliente, 'tok-123');
    expect(localStorage.getItem('foodloop:auth')).toContain('maria@foodloop.dev');
  });

  it('limpar remove a sessão e o token espelhado', () => {
    useAuthStore.getState().setSession(cliente, 'tok-123');
    useAuthStore.getState().limpar();
    expect(useAuthStore.getState().usuario).toBeNull();
    expect(localStorage.getItem('foodloop:token')).toBeNull();
  });
});

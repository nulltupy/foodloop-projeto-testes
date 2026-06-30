import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from './App';
import { useAuthStore } from '../features/auth/store';

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('App shell', () => {
  it('mostra a landing pública ao acessar / sem sessão', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /comida boa que sobrou/i })).toBeInTheDocument();
  });

  it('redireciona rota protegida para o login sem sessão', () => {
    render(
      <MemoryRouter initialEntries={['/pedidos']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /que bom te ver/i })).toBeInTheDocument();
  });

  it('imports @foodloop/lib without throwing', async () => {
    const mod = await import('@foodloop/lib');
    expect(typeof mod.api.createApiClient).toBe('function');
  });
});

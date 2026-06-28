import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';
import { useAuthStore } from '../../features/auth/store';
import { abrirSessao } from '../../mocks/db';

// O header agora inclui o sino de notificações (React Query), então o render
// precisa do QueryClientProvider — mesmas dependências do app real.
function renderHeader() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('Header', () => {
  it('mostra "Entrar" quando deslogado', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument();
  });

  it('mostra as iniciais e permite sair quando logado', async () => {
    useAuthStore
      .getState()
      .setSession(
        { id: 1, nome: 'Maria Silva', email: 'maria@foodloop.dev', tipo: 'cliente' },
        abrirSessao(1),
      );
    renderHeader();

    const avatar = screen.getByRole('button', { name: /conta e perfil/i });
    expect(avatar).toHaveTextContent('MS');

    await userEvent.click(avatar);
    expect(screen.getByText('maria@foodloop.dev')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /sair/i }));
    expect(useAuthStore.getState().usuario).toBeNull();
  });
});

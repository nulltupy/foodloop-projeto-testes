import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';
import { useAuthStore } from '../../features/auth/store';

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
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
      .setSession({ id: 1, nome: 'Maria Silva', email: 'maria@foodloop.dev', tipo: 'cliente' }, 'tok');
    renderHeader();

    const avatar = screen.getByRole('button', { name: /abrir menu da conta/i });
    expect(avatar).toHaveTextContent('MS');

    await userEvent.click(avatar);
    expect(screen.getByText('maria@foodloop.dev')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /sair/i }));
    expect(useAuthStore.getState().usuario).toBeNull();
  });
});

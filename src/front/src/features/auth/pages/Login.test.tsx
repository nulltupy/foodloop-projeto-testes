import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { Login } from './Login';
import { useAuthStore } from '../store';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>home do cliente</div>} />
        <Route path="/comerciante" element={<div>painel do comerciante</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('Tela de login', () => {
  it('tem labels associados e autocomplete corretos', () => {
    renderLogin();
    const email = screen.getByLabelText('E-mail');
    const senha = screen.getByLabelText('Senha');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(senha).toHaveAttribute('autocomplete', 'current-password');
  });

  it('faz login válido e redireciona o cliente para a home', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('E-mail'), 'cliente@foodloop.dev');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('home do cliente')).toBeInTheDocument();
    expect(useAuthStore.getState().usuario?.tipo).toBe('cliente');
  });

  it('mostra mensagem genérica em credenciais inválidas (401)', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('E-mail'), 'errado@foodloop.dev');
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaerrada');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/inválidos/i);
    expect(useAuthStore.getState().usuario).toBeNull();
  });
});

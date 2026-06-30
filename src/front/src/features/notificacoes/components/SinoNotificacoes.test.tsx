import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, it, expect } from 'vitest';
import { SinoNotificacoes } from './SinoNotificacoes';
import { useAuthStore } from '../../auth/store';

async function loginCliente() {
  const res = await fetch('http://localhost:3010/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@foodloop.dev', senha: 'senha123' }),
  });
  const data = await res.json();
  useAuthStore.getState().setSession(data.usuario, data.token);
}

function renderSino() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SinoNotificacoes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  localStorage.clear();
  await loginCliente();
});

describe('Sino de notificações', () => {
  it('marca como lida na hora ao pressionar, sem precisar recarregar', async () => {
    renderSino();

    // O cliente demo começa com 2 notificações não lidas.
    await userEvent.click(await screen.findByRole('button', { name: /2 não lidas/i }));

    // Boas-vindas não tem deep_link, então só marca como lida (não navega).
    await userEvent.click(await screen.findByText('Bem-vindo ao FoodLoop'));

    // O contador cai para 1 imediatamente (atualização otimista).
    expect(await screen.findByRole('button', { name: /1 não lida/i })).toBeInTheDocument();
  });

  it('"Marcar todas" zera o contador na hora', async () => {
    renderSino();

    await userEvent.click(await screen.findByRole('button', { name: /2 não lidas/i }));
    await userEvent.click(screen.getByRole('button', { name: /marcar todas/i }));

    expect(await screen.findByRole('button', { name: /^notificações$/i })).toBeInTheDocument();
  });
});

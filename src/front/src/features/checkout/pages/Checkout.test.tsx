import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { Checkout } from './Checkout';
import { useCarrinho } from '../store';
import { db } from '../../../mocks/db';
import { server } from '../../../mocks/server';
import { useAuthStore } from '../../auth/store';

function renderCheckout(busca: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/checkout${busca}`]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos/:id" element={<div>confirmação do pedido</div>} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function anuncioDisponivel() {
  const a = db.anuncios.find((x) => x.status === 'ATIVO' && x.quantidade_disponivel > 0);
  if (!a) throw new Error('seed sem anúncio disponível');
  return a;
}

beforeEach(async () => {
  useCarrinho.getState().limpar();
  localStorage.clear();
  // Login real para registrar uma sessão válida no MSW.
  const res = await fetch('http://localhost:3010/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@foodloop.dev', senha: 'senha123' }),
  });
  const data = await res.json();
  useAuthStore.getState().setSession(data.usuario, data.token);
});

describe('Tela de checkout', () => {
  it('mostra carrinho vazio com link para as ofertas', () => {
    renderCheckout('');
    expect(screen.getByText(/voltar às ofertas/i)).toBeInTheDocument();
  });

  it('lista o item, calcula o total e cria o pedido', async () => {
    const a = anuncioDisponivel();
    const produto = db.produtos.find((p) => p.id === a.id_produto)!;
    renderCheckout(`?anuncio=${a.id}`);

    expect(await screen.findByText(produto.nome, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /reservar e pagar presencialmente/i }));
    expect(await screen.findByText('confirmação do pedido')).toBeInTheDocument();
  });

  it('trata 409 de anúncio esgotado com mensagem clara', async () => {
    const a = anuncioDisponivel();
    server.use(
      http.post('/api/v1/pedidos', () =>
        HttpResponse.json({ error: { code: 'ANUNCIO_ESGOTADO', message: 'x' } }, { status: 409 }),
      ),
    );
    renderCheckout(`?anuncio=${a.id}`);
    await screen.findByRole('button', { name: /reservar e pagar presencialmente/i });

    await userEvent.click(screen.getByRole('button', { name: /reservar e pagar presencialmente/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/não está mais disponível/i);
  });
});

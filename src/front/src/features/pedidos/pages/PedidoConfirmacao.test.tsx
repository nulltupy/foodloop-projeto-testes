import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { PedidoConfirmacao } from './PedidoConfirmacao';
import { db } from '../../../mocks/db';

const BASE = 'http://localhost:3010';

function renderConfirmacao(id: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/pedidos/${id}`]}>
        <Routes>
          <Route path="/pedidos/:id" element={<PedidoConfirmacao />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Cria um pedido real no MSW e retorna o pedido criado.
async function criarPedido() {
  const login = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@foodloop.dev', senha: 'senha123' }),
  });
  const { token } = await login.json();
  const a = db.anuncios.find((x) => x.status === 'ATIVO' && x.quantidade_disponivel > 0)!;
  const res = await fetch(`${BASE}/api/v1/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itens: [{ id_anuncio: a.id, quantidade: 1 }] }),
  });
  return res.json();
}

describe('Tela de confirmação do pedido', () => {
  it('destaca o código de retirada, o status e o "Como chegar"', async () => {
    const pedido = await criarPedido();
    const estab = db.estabelecimentos.find((e) => e.id === pedido.id_estabelecimento)!;
    renderConfirmacao(pedido.id);

    expect(await screen.findByText(pedido.codigo_retirada)).toBeInTheDocument();
    expect(screen.getByText('Recebido')).toBeInTheDocument();

    const comoChegar = await screen.findByRole('link', { name: /como chegar/i });
    expect(comoChegar).toHaveAttribute(
      'href',
      `https://maps.google.com/?q=${estab.endereco.latitude},${estab.endereco.longitude}`,
    );
  });
});

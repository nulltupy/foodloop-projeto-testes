import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Pedido } from '@foodloop/lib';
import { MeusPedidos } from './MeusPedidos';
import { db } from '../../../mocks/db';
import { useAuthStore } from '../../auth/store';

function renderMeusPedidos() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MeusPedidos />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function loginCliente() {
  const res = await fetch('http://localhost:3010/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@foodloop.dev', senha: 'senha123' }),
  });
  const data = await res.json();
  useAuthStore.getState().setSession(data.usuario, data.token);
}

function pedidoRetirado(): Pedido {
  const anuncio = db.anuncios.find((a) => a.status === 'ATIVO' && a.quantidade_disponivel > 0)!;
  const produto = db.produtos.find((p) => p.id === anuncio.id_produto)!;
  const subtotal = anuncio.preco_promocional;
  const pedido: Pedido = {
    id: db.proximoId.pedido++,
    id_cliente: 1,
    id_estabelecimento: anuncio.id_estabelecimento,
    valor_total: subtotal,
    status: 'RETIRADO',
    codigo_retirada: 'TESTE123',
    data_pedido: new Date().toISOString(),
    data_retirada: new Date().toISOString(),
    itens: [
      {
        id: 1,
        id_anuncio: anuncio.id,
        quantidade: 1,
        preco_unitario: anuncio.preco_promocional,
        subtotal,
      },
    ],
  };
  produto.nome = 'Combo avaliado';
  db.pedidos.push(pedido);
  return pedido;
}

beforeEach(async () => {
  localStorage.clear();
  await loginCliente();
});

describe('MeusPedidos avaliações', () => {
  it('permite avaliar pedido retirado dentro de 24h', async () => {
    const pedido = pedidoRetirado();
    renderMeusPedidos();

    await userEvent.click(await screen.findByRole('button', { name: /avaliar pedido/i }));
    await userEvent.click(screen.getByRole('radio', { name: /4 estrelas/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /comentário/i }),
      'Retirada rápida e produto certo.',
    );
    await userEvent.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    expect(await screen.findByText('Avaliado')).toBeInTheDocument();
    expect(db.avaliacoes).toHaveLength(1);
    expect(db.avaliacoes[0]).toMatchObject({
      id_pedido: pedido.id,
      nota: 4,
      comentario: 'Retirada rápida e produto certo.',
    });
  });
});

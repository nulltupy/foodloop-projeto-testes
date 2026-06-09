import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import { OfertaDetalhe } from './OfertaDetalhe';
import { db } from '../../../mocks/db';
import { server } from '../../../mocks/server';

function renderDetalhe(id: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/oferta/${id}`]}>
        <Routes>
          <Route path="/oferta/:id" element={<OfertaDetalhe />} />
          <Route path="/checkout" element={<div>tela de checkout</div>} />
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

describe('Tela de detalhe da oferta', () => {
  it('mostra os dados e o botão "Como chegar" com as coordenadas', async () => {
    const a = anuncioDisponivel();
    const produto = db.produtos.find((p) => p.id === a.id_produto)!;
    const estab = db.estabelecimentos.find((e) => e.id === a.id_estabelecimento)!;
    renderDetalhe(a.id);

    expect(await screen.findByText(produto.nome)).toBeInTheDocument();
    const comoChegar = await screen.findByRole('link', { name: /como chegar/i });
    expect(comoChegar).toHaveAttribute(
      'href',
      `https://maps.google.com/?q=${estab.endereco.latitude},${estab.endereco.longitude}`,
    );
  });

  it('desabilita "Reservar" quando o anúncio está esgotado', async () => {
    const base = db.anuncios.find((x) => x.id === 1)!;
    server.use(
      http.get('/api/v1/anuncios/1', () =>
        HttpResponse.json({ ...base, quantidade_disponivel: 0, status: 'ATIVO' }),
      ),
    );
    renderDetalhe(1);
    expect(await screen.findByRole('button', { name: /indisponível/i })).toBeDisabled();
  });

  it('ao reservar, navega para o checkout', async () => {
    const a = anuncioDisponivel();
    renderDetalhe(a.id);
    await userEvent.click(await screen.findByRole('button', { name: 'Reservar' }));
    expect(await screen.findByText('tela de checkout')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { PerfilEstabelecimento } from './PerfilEstabelecimento';
import { db } from '../../../mocks/db';

function OfertasDestino() {
  const location = useLocation();
  return <div>ofertas filtradas {location.search}</div>;
}

function renderPerfil(id: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/estabelecimentos/${id}`]}>
        <Routes>
          <Route path="/estabelecimentos/:id" element={<PerfilEstabelecimento />} />
          <Route path="/" element={<OfertasDestino />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Perfil do estabelecimento', () => {
  it('mostra sobre, endereço com mapa e avaliações depois do cabeçalho', async () => {
    const estabelecimento = db.estabelecimentos[0]!;
    renderPerfil(estabelecimento.id);

    expect(await screen.findByRole('heading', { name: estabelecimento.nome_fantasia })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sobre' })).toBeInTheDocument();
    expect(screen.getByText(estabelecimento.descricao!)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Endereço' })).toBeInTheDocument();
    expect(screen.getByTitle(`Mapa de ${estabelecimento.nome_fantasia}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Avaliações' })).toBeInTheDocument();
  });

  it('leva Ver ofertas para a home com o estabelecimento filtrado', async () => {
    const estabelecimento = db.estabelecimentos[0]!;
    renderPerfil(estabelecimento.id);

    await userEvent.click(await screen.findByRole('link', { name: /ver ofertas/i }));

    expect(
      await screen.findByText(`ofertas filtradas ?estabelecimento=${estabelecimento.id}`),
    ).toBeInTheDocument();
  });
});

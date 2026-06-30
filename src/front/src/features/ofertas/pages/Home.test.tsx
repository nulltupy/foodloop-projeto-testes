import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { Home } from './Home';
import { db } from '../../../mocks/db';

function renderHome(initialEntry = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (sucesso: PositionCallback) =>
        sucesso({
          coords: { latitude: -23.55, longitude: -46.63 },
        } as GeolocationPosition),
    },
  });
});

describe('Home (lista de ofertas)', () => {
  it('lista ofertas próximas com link para o detalhe', async () => {
    renderHome();
    const links = await screen.findAllByRole('link');
    const paraDetalhe = links.filter((l) => l.getAttribute('href')?.startsWith('/oferta/'));
    expect(paraDetalhe.length).toBeGreaterThan(0);
  });

  it('mostra link para o perfil do estabelecimento no card', async () => {
    const anuncio = db.anuncios.find((a) => a.status === 'ATIVO' && a.quantidade_disponivel > 0)!;
    const estabelecimento = db.estabelecimentos.find((e) => e.id === anuncio.id_estabelecimento)!;

    renderHome();
    const linkPerfil = await screen.findAllByRole('link', { name: estabelecimento.nome_fantasia });
    expect(linkPerfil.some((l) => l.getAttribute('href') === `/estabelecimentos/${estabelecimento.id}`)).toBe(
      true,
    );
  });

  it('aplica filtro de estabelecimento vindo da URL', async () => {
    const anuncio = db.anuncios.find((a) => a.status === 'ATIVO' && a.quantidade_disponivel > 0)!;
    const estabelecimento = db.estabelecimentos.find((e) => e.id === anuncio.id_estabelecimento)!;
    const outro = db.estabelecimentos.find((e) => e.id !== estabelecimento.id)!;

    renderHome(`/?estabelecimento=${estabelecimento.id}`);

    expect((await screen.findAllByText(estabelecimento.nome_fantasia)).length).toBeGreaterThan(0);
    expect(screen.queryByText(outro.nome_fantasia)).not.toBeInTheDocument();
  });

  it('mostra estado vazio com CTA "Limpar filtros" quando o filtro não retorna nada', async () => {
    renderHome();
    // Garante que a lista carregou antes de filtrar.
    await screen.findAllByRole('link');
    // Preço máximo de R$ 1 não cobre nenhuma promoção (mínimo ~R$ 5).
    await userEvent.click(screen.getByRole('button', { name: /filtrar/i }));
    await userEvent.type(screen.getByLabelText('Preço máximo'), '1');
    await userEvent.click(screen.getByRole('button', { name: /ver ofertas/i }));
    expect(await screen.findByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type AnuncioListItem, type ListarAnunciosQuery } from '@foodloop/lib';
import { Home } from './Home';
import { db } from '../../../mocks/db';

// `api.anuncios.listar` é mockado diretamente (sem MSW). A implementação
// default delega pra função real (axios -> MSW -> db) para preservar os testes
// existentes; os novos testes de busca sobrescrevem por teste e o afterEach
// restaura a default.
const holder = vi.hoisted(() => ({
  realListar: null as ((query: ListarAnunciosQuery) => Promise<AnuncioListItem[]>) | null,
}));

vi.mock('@foodloop/lib', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const listarReal = actual.api.anuncios.listar as (query: ListarAnunciosQuery) => Promise<AnuncioListItem[]>;
  holder.realListar = listarReal;
  return {
    ...actual,
    api: {
      ...actual.api,
      anuncios: { ...actual.api.anuncios, listar: vi.fn(listarReal) },
    },
  };
});

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

afterEach(() => {
  const mock = vi.mocked(api.anuncios.listar);
  mock.mockReset();
  if (holder.realListar) mock.mockImplementation(holder.realListar);
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

describe('Home — busca por produto ou estabelecimento', () => {
  it('envia q ao digitar na busca', async () => {
    renderHome();
    await screen.findAllByRole('link');

    await userEvent.type(screen.getByPlaceholderText('Buscar produto ou estabelecimento'), 'pão');

    await waitFor(() => {
      expect(vi.mocked(api.anuncios.listar).mock.calls.some((args) => args[0].q === 'pão')).toBe(true);
    });
  });

  it('remove q ao limpar a busca', async () => {
    renderHome();
    await screen.findAllByRole('link');

    await userEvent.type(screen.getByPlaceholderText('Buscar produto ou estabelecimento'), 'pão');
    await waitFor(() => {
      expect(vi.mocked(api.anuncios.listar).mock.calls.some((args) => args[0].q === 'pão')).toBe(true);
    });

    await userEvent.click(screen.getByRole('button', { name: /limpar busca/i }));

    await waitFor(() => {
      const ultima = vi.mocked(api.anuncios.listar).mock.calls.at(-1);
      expect(ultima?.[0].q).toBeUndefined();
    });
  });

  it('mostra estado vazio de busca quando não há resultados', async () => {
    vi.mocked(api.anuncios.listar).mockResolvedValue([]);

    renderHome();
    await screen.findByPlaceholderText('Buscar produto ou estabelecimento');

    await userEvent.type(screen.getByPlaceholderText('Buscar produto ou estabelecimento'), 'xyz');

    expect(await screen.findByText('Nenhuma oferta encontrada')).toBeInTheDocument();
    expect(screen.getByText('Tente outro produto ou estabelecimento.')).toBeInTheDocument();
  });
});

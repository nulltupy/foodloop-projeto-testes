import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { RotaProtegida } from '../../auth/components/RotaProtegida';
import { useAuthStore } from '../../auth/store';
import { abrirSessao, db } from '../../../mocks/db';
import { server } from '../../../mocks/server';
import { PainelComerciante } from './PainelComerciante';
import { PainelLoja } from './PainelLoja';

function renderPainel() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/comerciante/loja']}>
        <Routes>
          <Route path="/login" element={<div>login</div>} />
          <Route path="/" element={<div>home</div>} />
          <Route element={<RotaProtegida tipo="comerciante" />}>
            <Route path="/comerciante" element={<PainelComerciante />}>
              <Route path="loja" element={<PainelLoja />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('Painel do comerciante', () => {
  it('mostra cadastro de loja para comerciante novo sem refetch em loop', async () => {
    db.usuarios.push({
      id: 99,
      nome: 'Comerciante Novo',
      email: 'novo-comerciante@foodloop.dev',
      senha: 'senha12345',
      telefone: '+5511999999999',
      tipo: 'comerciante',
      cnpj: '12345678000155',
    });
    useAuthStore
      .getState()
      .setSession(
        { id: 99, nome: 'Comerciante Novo', email: 'novo-comerciante@foodloop.dev', tipo: 'comerciante' },
        abrirSessao(99),
      );

    let chamadas = 0;
    server.use(
      http.get('/api/v1/estabelecimentos/me', () => {
        chamadas += 1;
        return HttpResponse.json(
          { error: { code: 'RECURSO_NAO_ENCONTRADO', message: 'Sem estabelecimento' } },
          { status: 404 },
        );
      }),
    );

    renderPainel();

    expect(await screen.findByRole('heading', { name: /cadastre sua loja/i })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(chamadas).toBe(1);
  });
});

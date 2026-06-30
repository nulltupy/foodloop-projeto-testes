import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AvaliacoesEstabelecimento } from './AvaliacoesEstabelecimento';
import { db } from '../../../mocks/db';

function renderLista(estabelecimentoId: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AvaliacoesEstabelecimento estabelecimentoId={estabelecimentoId} />
    </QueryClientProvider>,
  );
}

describe('Avaliações do estabelecimento', () => {
  it('mostra estado vazio quando não há avaliações', async () => {
    const estabelecimento = db.estabelecimentos[0]!;
    renderLista(estabelecimento.id);
    expect(await screen.findByText(/ainda não recebeu avaliações/i)).toBeInTheDocument();
  });

  it('lista a avaliação com autor, nota e a thread de comentários', async () => {
    const estabelecimento = db.estabelecimentos[0]!;
    const cliente = db.usuarios[0]!;
    db.avaliacoes.push({
      id: 1,
      id_pedido: 1,
      id_estabelecimento: estabelecimento.id,
      nota: 5,
      comentario: 'Comida excelente',
      data_avaliacao: new Date().toISOString(),
      id_cliente: cliente.id,
    });
    db.comentarios.push({
      id: 1,
      id_avaliacao: 1,
      comentario: 'Obrigado pela visita!',
      data_comentario: new Date().toISOString(),
      autor: { nome: 'Comerciante Demo', tipo: 'comerciante' },
      id_usuario: 2,
    });

    renderLista(estabelecimento.id);

    expect(await screen.findByText('Comida excelente')).toBeInTheDocument();
    expect(screen.getByText('Cliente D.')).toBeInTheDocument();
    expect(screen.getByText('Obrigado pela visita!')).toBeInTheDocument();
    expect(screen.getByText('Estabelecimento')).toBeInTheDocument();
  });
});

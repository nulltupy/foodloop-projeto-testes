import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { StatusPedido } from '@foodloop/lib';

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const ROTULO_STATUS: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
};

export function PedidoConfirmacao() {
  const { id } = useParams();
  const pedidoId = Number(id);

  const pedidoQ = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => api.pedidos.getById(pedidoId),
    // Atualiza o status periodicamente enquanto a tela estiver aberta.
    refetchInterval: 5000,
  });
  const pedido = pedidoQ.data;

  const estabQ = useQuery({
    queryKey: ['estabelecimento', pedido?.id_estabelecimento],
    queryFn: () => api.estabelecimentos.getById(pedido!.id_estabelecimento),
    enabled: !!pedido,
  });
  const estab = estabQ.data;

  if (pedidoQ.isLoading) {
    return <div className="mx-auto m-4 h-64 max-w-2xl animate-pulse rounded-lg bg-surface-100" />;
  }

  if (pedidoQ.isError || !pedido) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-ink-700">Não foi possível carregar o pedido.</p>
        <Link to="/" className="mt-3 inline-block font-medium text-brand-700">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  const coords = estab?.endereco;

  return (
    <main className="mx-auto w-full max-w-2xl p-4 text-center">
      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
        {ROTULO_STATUS[pedido.status]}
      </span>

      <p className="mt-6 text-sm text-ink-700">Apresente este código no balcão</p>
      <p className="select-all font-mono text-5xl font-bold tracking-widest text-ink-900">
        {pedido.codigo_retirada}
      </p>

      {estab && (
        <div className="mt-6 rounded-lg border border-surface-200 bg-white p-4 text-left">
          <p className="font-medium text-ink-900">{estab.nome_fantasia}</p>
          {coords && (
            <a
              href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-medium text-brand-700"
            >
              Como chegar
            </a>
          )}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2 text-left">
        {pedido.itens.map((item) => (
          <li
            key={item.id}
            className="flex justify-between rounded-lg border border-surface-200 bg-white p-3"
          >
            <span className="text-ink-900">
              {item.quantidade}× anúncio #{item.id_anuncio}
            </span>
            <span className="font-medium text-ink-900">{moeda(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between text-lg font-semibold text-ink-900">
        <span>Total</span>
        <span>{moeda(pedido.valor_total)}</span>
      </div>
    </main>
  );
}

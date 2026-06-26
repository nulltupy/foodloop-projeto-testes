import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { ROTULO_STATUS } from '../status';
import { moeda } from '../../../lib/format';
import { mensagemErro } from '../../../lib/erros';

export function PedidoConfirmacao() {
  const { id } = useParams();
  const pedidoId = Number(id);
  const qc = useQueryClient();

  const pedidoQ = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => api.pedidos.getById(pedidoId),
    // Atualiza o status periodicamente enquanto a tela estiver aberta.
    refetchInterval: 5000,
  });
  const pedido = pedidoQ.data;

  const [confirmandoCancel, setConfirmandoCancel] = useState(false);
  const [erroCancel, setErroCancel] = useState<string | null>(null);
  const cancelar = useMutation({
    mutationFn: () => api.pedidos.cancelar(pedidoId),
    onSuccess: () => {
      setConfirmandoCancel(false);
      void qc.invalidateQueries({ queryKey: ['pedido', pedidoId] });
      void qc.invalidateQueries({ queryKey: ['pedidos-meus'] });
    },
    onError: (e) => setErroCancel(mensagemErro(e, 'Não foi possível cancelar o pedido')),
  });

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

      {erroCancel && (
        <div role="alert" className="mt-4 rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600">
          {erroCancel}
        </div>
      )}

      {/* Cliente só pode cancelar enquanto o pedido foi apenas recebido. */}
      {pedido.status === 'RECEBIDO' &&
        (confirmandoCancel ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-danger-600">Cancelar este pedido?</span>
            <button
              type="button"
              onClick={() => cancelar.mutate()}
              disabled={cancelar.isPending}
              className="min-h-11 rounded-lg bg-danger-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              Sim, cancelar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoCancel(false)}
              className="min-h-11 rounded-lg border border-surface-300 px-4 text-sm font-medium text-ink-700"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setErroCancel(null);
              setConfirmandoCancel(true);
            }}
            className="mt-4 min-h-11 w-full rounded-lg border border-danger-500 px-4 font-medium text-danger-600"
          >
            Cancelar pedido
          </button>
        ))}

      <Link to="/pedidos" className="mt-6 inline-block font-medium text-brand-700">
        Ver todos os meus pedidos
      </Link>
    </main>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { BADGE_STATUS, ROTULO_STATUS } from '../status';
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
    return <div className="mx-auto m-4 h-72 max-w-md animate-pulse rounded-3xl bg-canvas-line/60" />;
  }

  if (pedidoQ.isError || !pedido) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="text-ink-soft">Não foi possível carregar o pedido.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-leaf-dark hover:underline">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  const coords = estab?.endereco;
  const ativo = pedido.status !== 'CANCELADO';

  return (
    <main className="mx-auto w-full max-w-md p-4 sm:p-6">
      <div className="text-center">
        <span
          className={`mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full ${
            ativo ? 'bg-leaf-100 text-leaf-dark' : 'bg-danger-50 text-danger'
          }`}
        >
          {ativo ? (
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              aria-hidden="true"
            >
              <path d="m5 13 4 4 10-11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">
          {ativo ? 'Pedido confirmado!' : 'Pedido cancelado'}
        </h1>
        <p className="mt-1 text-ink-soft">
          {ativo ? 'Tá reservado. É só retirar e pagar na hora.' : 'Esse pedido foi cancelado.'}
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${BADGE_STATUS[pedido.status]}`}
        >
          {ROTULO_STATUS[pedido.status]}
        </span>
      </div>

      {ativo && (
        <div className="mt-6 animate-rise overflow-hidden rounded-3xl bg-leaf p-6 text-center text-white shadow-pop">
          <p className="text-sm font-semibold text-leaf-100">Seu código de retirada</p>
          <p className="nums mt-1 select-all text-5xl font-extrabold">{pedido.codigo_retirada}</p>
          <p className="mt-2 text-sm text-leaf-100">Mostre no balcão para retirar seu pedido.</p>
        </div>
      )}

      {estab && (
        <div className="card mt-4 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="lbl">Retirar em</p>
            <p className="mt-0.5 truncate font-bold text-ink">{estab.nome_fantasia}</p>
          </div>
          {coords && (
            <a
              href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-soft shrink-0"
            >
              Como chegar
            </a>
          )}
        </div>
      )}

      <div className="card mt-4 p-4">
        <ul className="flex flex-col gap-2">
          {pedido.itens.map((item) => (
            <li key={item.id} className="flex justify-between text-ink-soft">
              <span>{item.quantidade}× item reservado</span>
              <span className="nums font-semibold text-ink">{moeda(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-canvas-line pt-3 text-lg font-bold text-ink">
          <span>Total</span>
          <span className="nums">{moeda(pedido.valor_total)}</span>
        </div>
      </div>

      {erroCancel && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
        >
          {erroCancel}
        </div>
      )}

      {/* Cliente só pode cancelar enquanto o pedido foi apenas recebido. */}
      {pedido.status === 'RECEBIDO' &&
        (confirmandoCancel ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-semibold text-danger">Cancelar este pedido?</span>
            <button
              type="button"
              onClick={() => cancelar.mutate()}
              disabled={cancelar.isPending}
              className="btn btn-danger"
            >
              Sim, cancelar
            </button>
            <button type="button" onClick={() => setConfirmandoCancel(false)} className="btn btn-outline">
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
            className="btn btn-outline mt-4 w-full hover:border-danger hover:text-danger"
          >
            Cancelar pedido
          </button>
        ))}

      <Link to="/pedidos" className="mt-6 block text-center font-bold text-leaf-dark hover:underline">
        Ver todos os meus pedidos
      </Link>
    </main>
  );
}

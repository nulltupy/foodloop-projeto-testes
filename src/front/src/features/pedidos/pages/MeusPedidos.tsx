import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { PedidoClienteListItem } from '@foodloop/lib';
import { BADGE_STATUS, ehAtivo, ROTULO_STATUS } from '../status';
import { dataHora, moeda } from '../../../lib/format';
import { mensagemErro } from '../../../lib/erros';

const CHAVE = ['pedidos-meus'];

// Ativos primeiro (mais recentes no topo); encerrados depois, também por data desc.
function ordenar(a: PedidoClienteListItem, b: PedidoClienteListItem): number {
  if (ehAtivo(a.status) !== ehAtivo(b.status)) return ehAtivo(a.status) ? -1 : 1;
  return new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime();
}

export function MeusPedidos() {
  const qc = useQueryClient();
  const pedidosQ = useQuery({
    queryKey: CHAVE,
    queryFn: () => api.pedidos.listarMeus(),
    // Reflete mudanças de status feitas pelo comerciante.
    refetchInterval: 15_000,
  });

  const [confirmandoCancel, setConfirmandoCancel] = useState<number | null>(null);
  const [erroPedido, setErroPedido] = useState<Record<number, string>>({});

  const cancelar = useMutation({
    mutationFn: (id: number) => api.pedidos.cancelar(id),
    onSuccess: () => {
      setConfirmandoCancel(null);
      void qc.invalidateQueries({ queryKey: CHAVE });
    },
    onError: (e, id) => setErroPedido((m) => ({ ...m, [id]: mensagemErro(e, 'Não foi possível cancelar') })),
  });

  const pedidos = pedidosQ.data ? [...pedidosQ.data].sort(ordenar) : [];

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Meus pedidos</h1>
      <p className="mt-1 text-sm text-ink-500">
        Acompanhe seus pedidos e apresente o código de retirada no balcão.
      </p>

      {pedidosQ.isLoading && <p className="mt-6 text-sm text-ink-500">Carregando…</p>}
      {pedidosQ.isError && (
        <div className="mt-6 rounded-md bg-danger-500/10 p-3 text-sm text-danger-600">
          Não foi possível carregar seus pedidos.
        </div>
      )}
      {pedidosQ.data && pedidos.length === 0 && (
        <div className="mt-6 text-center text-sm text-ink-500">
          <p>Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="mt-2 inline-block font-medium text-brand-700">
            Ver ofertas
          </Link>
        </div>
      )}

      <ul className="mt-6 grid gap-3">
        {pedidos.map((p) => {
          const ativo = ehAtivo(p.status);
          const erro = erroPedido[p.id];
          return (
            <li key={p.id} className="rounded-lg border border-surface-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-900">{p.estabelecimento.nome_fantasia}</p>
                  <p className="text-sm text-ink-500">
                    Pedido #{p.id} · {dataHora(p.data_pedido)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${BADGE_STATUS[p.status]}`}>
                  {ROTULO_STATUS[p.status]}
                </span>
              </div>

              {ativo && (
                <div className="mt-3 rounded-md bg-surface-50 p-3 text-center">
                  <p className="text-xs text-ink-500">Código de retirada</p>
                  <p className="select-all font-mono text-2xl font-bold tracking-widest text-ink-900">
                    {p.codigo_retirada}
                  </p>
                </div>
              )}

              <ul className="mt-3 grid gap-1 text-sm text-ink-700">
                {p.itens.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantidade}× {item.produto_nome}
                    </span>
                    <span>{moeda(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex justify-between border-t border-surface-200 pt-2 font-semibold text-ink-900">
                <span>Total</span>
                <span>{moeda(p.valor_total)}</span>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="mt-3 rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600"
                >
                  {erro}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to={`/pedidos/${p.id}`}
                  className="min-h-11 rounded-lg border border-surface-300 px-4 text-sm font-medium leading-[2.75rem] text-ink-700"
                >
                  Detalhes
                </Link>

                {/* Cliente só pode cancelar enquanto o pedido foi apenas recebido. */}
                {p.status === 'RECEBIDO' &&
                  (confirmandoCancel === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-danger-600">Cancelar pedido?</span>
                      <button
                        type="button"
                        onClick={() => cancelar.mutate(p.id)}
                        disabled={cancelar.isPending}
                        className="min-h-11 rounded-lg bg-danger-500 px-3 text-sm font-medium text-white disabled:opacity-60"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoCancel(null)}
                        className="min-h-11 rounded-lg border border-surface-300 px-3 text-sm font-medium text-ink-700"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setErroPedido((m) => ({ ...m, [p.id]: '' }));
                        setConfirmandoCancel(p.id);
                      }}
                      className="min-h-11 rounded-lg border border-danger-500 px-4 text-sm font-medium text-danger-600"
                    >
                      Cancelar
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { PedidoClienteListItem, StatusPedido } from '@foodloop/lib';
import { BADGE_STATUS, ehAtivo, ROTULO_STATUS } from '../status';
import { dataHora, moeda } from '../../../lib/format';
import { mensagemErro } from '../../../lib/erros';
import { Marca } from '../../../components/ui/Marca';
import { FormAvaliacao } from '../../avaliacoes/components/FormAvaliacao';

const CHAVE = ['pedidos-meus'];

const PASSOS: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'RETIRADO'];
const PASSO_LABEL: Record<string, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Preparo',
  PRONTO_PARA_RETIRADA: 'Pronto',
  RETIRADO: 'Retirado',
};

// Ativos primeiro (mais recentes no topo); encerrados depois, também por data desc.
function ordenar(a: PedidoClienteListItem, b: PedidoClienteListItem): number {
  if (ehAtivo(a.status) !== ehAtivo(b.status)) return ehAtivo(a.status) ? -1 : 1;
  return new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime();
}

function Stepper({ status }: { status: StatusPedido }) {
  const atual = PASSOS.indexOf(status);
  return (
    <div className="mt-3 flex items-center">
      {PASSOS.map((s, i) => {
        const feito = i <= atual;
        return (
          <Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${feito ? 'bg-leaf' : 'bg-canvas-line'}`}
              />
              <span className={`text-[11px] font-bold ${feito ? 'text-leaf-dark' : 'text-ink-mute'}`}>
                {PASSO_LABEL[s]}
              </span>
            </div>
            {i < PASSOS.length - 1 && (
              <span
                className={`mx-1 mb-4 h-0.5 flex-1 rounded-full transition-colors ${i < atual ? 'bg-leaf' : 'bg-canvas-line'}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
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
  // Pedido cujo formulário de avaliação está aberto, e os já avaliados nesta sessão.
  const [avaliando, setAvaliando] = useState<number | null>(null);
  const [avaliados, setAvaliados] = useState<Set<number>>(new Set());

  const cancelar = useMutation({
    mutationFn: (id: number) => api.pedidos.cancelar(id),
    onSuccess: () => {
      setConfirmandoCancel(null);
      void qc.invalidateQueries({ queryKey: CHAVE });
    },
    onError: (e, id) => setErroPedido((m) => ({ ...m, [id]: mensagemErro(e, 'Não foi possível cancelar') })),
  });

  const pedidos = pedidosQ.data ? [...pedidosQ.data].sort(ordenar) : [];
  const pedidoAvaliando = avaliando !== null ? pedidos.find((p) => p.id === avaliando) : undefined;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Meus pedidos</h1>
      <p className="mt-1 text-ink-soft">Acompanhe o status e mostre o código no balcão.</p>

      {pedidosQ.isLoading && (
        <div className="mt-6 grid gap-3" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-canvas-line/60" />
          ))}
        </div>
      )}
      {pedidosQ.isError && (
        <div className="mt-6 rounded-2xl bg-danger-50 p-4 text-sm font-semibold text-danger-dark">
          Não foi possível carregar seus pedidos.
        </div>
      )}
      {pedidosQ.data && pedidos.length === 0 && (
        <div className="card mx-auto mt-10 max-w-sm p-8 text-center">
          <Marca className="mx-auto h-12 w-12" />
          <p className="mt-4 text-lg font-extrabold text-ink">Nenhum pedido ainda</p>
          <p className="mt-1 text-ink-soft">Que tal resgatar algo gostoso pertinho de você?</p>
          <Link to="/" className="btn btn-primary mt-5">
            Ver ofertas
          </Link>
        </div>
      )}

      <ul className="mt-6 grid gap-4">
        {pedidos.map((p, i) => {
          const ativo = ehAtivo(p.status);
          const erro = erroPedido[p.id];
          return (
            <li
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
              className="card animate-rise p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-ink">{p.estabelecimento.nome_fantasia}</p>
                  <p className="text-sm text-ink-mute">
                    Pedido #{p.id} · {dataHora(p.data_pedido)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${BADGE_STATUS[p.status]}`}>
                  {ROTULO_STATUS[p.status]}
                </span>
              </div>

              {p.status !== 'CANCELADO' && <Stepper status={p.status} />}

              {ativo && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-leaf-50 px-4 py-3">
                  <span className="text-sm font-semibold text-leaf-dark">Código de retirada</span>
                  <span className="nums select-all text-xl font-extrabold text-leaf-deep">
                    {p.codigo_retirada}
                  </span>
                </div>
              )}

              <ul className="mt-3 grid gap-1 text-sm text-ink-soft">
                {p.itens.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantidade}× {item.produto_nome}
                    </span>
                    <span className="nums">{moeda(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex justify-between border-t border-canvas-line pt-2 font-bold text-ink">
                <span>Total</span>
                <span className="nums">{moeda(p.valor_total)}</span>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
                >
                  {erro}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link to={`/pedidos/${p.id}`} className="btn btn-outline">
                  Detalhes
                </Link>

                {/* Avaliação só faz sentido depois que o pedido foi retirado. */}
                {p.status === 'RETIRADO' &&
                  (avaliados.has(p.id) ? (
                    <span className="text-sm font-semibold text-leaf-dark">Avaliação enviada</span>
                  ) : (
                    <button type="button" onClick={() => setAvaliando(p.id)} className="btn btn-soft">
                      Avaliar
                    </button>
                  ))}

                {/* Cliente só pode cancelar enquanto o pedido foi apenas recebido. */}
                {p.status === 'RECEBIDO' &&
                  (confirmandoCancel === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-danger">Cancelar?</span>
                      <button
                        type="button"
                        onClick={() => cancelar.mutate(p.id)}
                        disabled={cancelar.isPending}
                        className="btn btn-danger"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoCancel(null)}
                        className="btn btn-outline"
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
                      className="btn btn-outline hover:border-danger hover:text-danger"
                    >
                      Cancelar
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>

      {pedidoAvaliando && (
        <FormAvaliacao
          pedidoId={pedidoAvaliando.id}
          estabelecimentoNome={pedidoAvaliando.estabelecimento.nome_fantasia}
          aberto
          onFechar={() => setAvaliando(null)}
          onSucesso={() => {
            setAvaliados((s) => new Set(s).add(pedidoAvaliando.id));
            setAvaliando(null);
          }}
        />
      )}
    </main>
  );
}

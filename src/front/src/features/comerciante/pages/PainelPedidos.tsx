import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { PedidoComercianteListItem, StatusPedido } from '@foodloop/lib';
import { BADGE_STATUS, ehAtivo, ROTULO_STATUS } from '../../pedidos/status';
import { dataHora, moeda } from '../../../lib/format';
import { mensagemErro } from '../../../lib/erros';

const CHAVE = ['pedidos-comerciante'];

// Próximo passo do fluxo (exceto a retirada, que exige o código do cliente).
const PROXIMO: Partial<Record<StatusPedido, { status: StatusPedido; rotulo: string }>> = {
  RECEBIDO: { status: 'EM_PREPARO', rotulo: 'Iniciar preparo' },
  EM_PREPARO: { status: 'PRONTO_PARA_RETIRADA', rotulo: 'Marcar pronto' },
};

// Ativos primeiro (mais antigos no topo, ordem de chegada); encerrados ao fim.
function ordenar(a: PedidoComercianteListItem, b: PedidoComercianteListItem): number {
  if (ehAtivo(a.status) !== ehAtivo(b.status)) return ehAtivo(a.status) ? -1 : 1;
  const t = new Date(a.data_pedido).getTime() - new Date(b.data_pedido).getTime();
  return ehAtivo(a.status) ? t : -t;
}

export function PainelPedidos() {
  const qc = useQueryClient();
  const pedidosQ = useQuery({
    queryKey: CHAVE,
    queryFn: () => api.pedidos.listarComerciante(),
    // Mantém o balcão atualizado conforme novos pedidos chegam.
    refetchInterval: 10_000,
  });

  const [codigos, setCodigos] = useState<Record<number, string>>({});
  const [confirmandoCancel, setConfirmandoCancel] = useState<number | null>(null);
  const [erroPedido, setErroPedido] = useState<Record<number, string>>({});

  function invalidar() {
    void qc.invalidateQueries({ queryKey: CHAVE });
  }
  function limparErro(id: number) {
    setErroPedido((e) => ({ ...e, [id]: '' }));
  }

  const avancar = useMutation({
    mutationFn: (args: { id: number; status: StatusPedido }) =>
      api.pedidos.avancarStatus(args.id, { novo_status: args.status }),
    onSuccess: invalidar,
    onError: (e, args) =>
      setErroPedido((m) => ({ ...m, [args.id]: mensagemErro(e, 'Não foi possível avançar o pedido') })),
  });

  const retirar = useMutation({
    mutationFn: (args: { id: number; codigo: string }) =>
      api.pedidos.avancarStatus(args.id, {
        novo_status: 'RETIRADO',
        codigo_retirada: args.codigo,
      }),
    onSuccess: (_d, args) => {
      setCodigos((c) => ({ ...c, [args.id]: '' }));
      limparErro(args.id);
      invalidar();
    },
    onError: (e, args) =>
      setErroPedido((m) => ({ ...m, [args.id]: mensagemErro(e, 'Código de retirada inválido') })),
  });

  const cancelar = useMutation({
    mutationFn: (id: number) => api.pedidos.cancelar(id),
    onSuccess: () => {
      setConfirmandoCancel(null);
      invalidar();
    },
    onError: (e, id) => setErroPedido((m) => ({ ...m, [id]: mensagemErro(e, 'Não foi possível cancelar') })),
  });

  const pedidos = pedidosQ.data ? [...pedidosQ.data].sort(ordenar) : [];

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Pedidos</h1>
      <p className="mt-1 text-sm text-ink-500">
        Acompanhe os pedidos recebidos e avance cada um até a retirada. Para confirmar a entrega, peça o
        código de 8 caracteres ao cliente.
      </p>

      {pedidosQ.isLoading && <p className="mt-6 text-sm text-ink-500">Carregando…</p>}
      {pedidosQ.isError && (
        <div className="mt-6 rounded-md bg-danger-500/10 p-3 text-sm text-danger-600">
          Não foi possível carregar os pedidos. Confirme que você está logado como comerciante.
        </div>
      )}
      {pedidosQ.data && pedidos.length === 0 && (
        <p className="mt-6 text-sm text-ink-500">Nenhum pedido por enquanto.</p>
      )}

      <ul className="mt-6 grid gap-3">
        {pedidos.map((p) => {
          const proximo = PROXIMO[p.status];
          const erro = erroPedido[p.id];
          const pendente = avancar.isPending || retirar.isPending || cancelar.isPending;
          return (
            <li key={p.id} className="rounded-lg border border-surface-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-900">Pedido #{p.id}</p>
                  <p className="text-sm text-ink-500">
                    {p.cliente.nome} · {dataHora(p.data_pedido)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${BADGE_STATUS[p.status]}`}>
                  {ROTULO_STATUS[p.status]}
                </span>
              </div>

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

              {p.status === 'PRONTO_PARA_RETIRADA' && (
                <form
                  className="mt-3 flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const codigo = (codigos[p.id] ?? '').trim().toUpperCase();
                    if (codigo.length !== 8) {
                      setErroPedido((m) => ({ ...m, [p.id]: 'Informe os 8 caracteres do código' }));
                      return;
                    }
                    retirar.mutate({ id: p.id, codigo });
                  }}
                >
                  <input
                    type="text"
                    value={codigos[p.id] ?? ''}
                    onChange={(e) => {
                      setCodigos((c) => ({ ...c, [p.id]: e.target.value.toUpperCase() }));
                      if (erro) limparErro(p.id);
                    }}
                    maxLength={8}
                    placeholder="Código do cliente"
                    aria-label={`Código de retirada do pedido ${p.id}`}
                    className="min-h-11 flex-1 rounded-lg border border-surface-300 px-3 font-mono uppercase tracking-widest"
                  />
                  <button
                    type="submit"
                    disabled={pendente}
                    className="min-h-11 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
                  >
                    Confirmar retirada
                  </button>
                </form>
              )}

              {(proximo || ehAtivo(p.status)) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {proximo && (
                    <button
                      type="button"
                      onClick={() => {
                        limparErro(p.id);
                        avancar.mutate({ id: p.id, status: proximo.status });
                      }}
                      disabled={pendente}
                      className="min-h-11 flex-1 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
                    >
                      {proximo.rotulo}
                    </button>
                  )}

                  {ehAtivo(p.status) &&
                    (confirmandoCancel === p.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-danger-600">Cancelar pedido?</span>
                        <button
                          type="button"
                          onClick={() => cancelar.mutate(p.id)}
                          disabled={pendente}
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
                          limparErro(p.id);
                          setConfirmandoCancel(p.id);
                        }}
                        className="min-h-11 rounded-lg border border-danger-500 px-4 text-sm font-medium text-danger-600"
                      >
                        Cancelar
                      </button>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

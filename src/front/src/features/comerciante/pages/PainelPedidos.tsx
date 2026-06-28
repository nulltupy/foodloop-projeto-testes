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
      api.pedidos.avancarStatus(args.id, { novo_status: 'RETIRADO', codigo_retirada: args.codigo }),
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
    <section>
      <p className="mb-4 text-sm text-ink-soft">
        Avance cada pedido até a retirada. Para confirmar a entrega, peça o código de 8 caracteres ao cliente.
      </p>

      {pedidosQ.isLoading && <p className="text-sm text-ink-mute">Carregando…</p>}
      {pedidosQ.isError && (
        <div className="rounded-2xl bg-danger-50 p-3 text-sm font-semibold text-danger-dark">
          Não foi possível carregar os pedidos. Confirme que você está logado como comerciante.
        </div>
      )}
      {pedidosQ.data && pedidos.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-lg font-extrabold text-ink">Balcão tranquilo</p>
          <p className="mt-1 text-sm text-ink-soft">Nenhum pedido por enquanto.</p>
        </div>
      )}

      <ul className="grid gap-3">
        {pedidos.map((p) => {
          const proximo = PROXIMO[p.status];
          const erro = erroPedido[p.id];
          const pendente = avancar.isPending || retirar.isPending || cancelar.isPending;
          return (
            <li key={p.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-extrabold text-ink">Pedido #{p.id}</p>
                  <p className="text-sm text-ink-mute">
                    {p.cliente.nome} · {dataHora(p.data_pedido)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${BADGE_STATUS[p.status]}`}>
                  {ROTULO_STATUS[p.status]}
                </span>
              </div>

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
                    className="campo min-w-0 flex-1 font-semibold uppercase"
                  />
                  <button type="submit" disabled={pendente} className="btn btn-primary">
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
                      className="btn btn-primary flex-1"
                    >
                      {proximo.rotulo}
                    </button>
                  )}

                  {ehAtivo(p.status) &&
                    (confirmandoCancel === p.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-danger">Cancelar pedido?</span>
                        <button
                          type="button"
                          onClick={() => cancelar.mutate(p.id)}
                          disabled={pendente}
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
                          limparErro(p.id);
                          setConfirmandoCancel(p.id);
                        }}
                        className="btn btn-outline hover:border-danger hover:text-danger"
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
    </section>
  );
}

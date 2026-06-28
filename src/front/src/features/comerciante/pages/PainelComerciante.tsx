import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { ehAtivo } from '../../pedidos/status';
import { statusErro } from '../../../lib/erros';

const CHAVE_LOJA = ['estabelecimento-meu'];

function aba({ isActive }: { isActive: boolean }) {
  return `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
    isActive ? 'bg-canvas-card text-leaf-dark shadow-soft' : 'text-ink-soft hover:text-ink'
  }`;
}

export function PainelComerciante() {
  const qc = useQueryClient();
  const location = useLocation();

  const lojaQ = useQuery({
    queryKey: CHAVE_LOJA,
    queryFn: () => api.estabelecimentos.getMeu(),
    retry: false,
  });
  const semLoja = lojaQ.isError && statusErro(lojaQ.error) === 404;
  const loja = lojaQ.data;
  const podeBuscarPedidos = lojaQ.isSuccess && !!loja;

  const pedidosQ = useQuery({
    queryKey: ['pedidos-comerciante'],
    queryFn: () => api.pedidos.listarComerciante(),
    enabled: podeBuscarPedidos,
    refetchInterval: podeBuscarPedidos ? 15_000 : false,
  });
  const pendentes = podeBuscarPedidos ? (pedidosQ.data?.filter((p) => ehAtivo(p.status)).length ?? 0) : 0;

  function invalidarLoja() {
    void qc.invalidateQueries({ queryKey: CHAVE_LOJA });
  }
  const fechar = useMutation({ mutationFn: () => api.estabelecimentos.fechar(), onSuccess: invalidarLoja });
  const abrir = useMutation({ mutationFn: () => api.estabelecimentos.abrir(), onSuccess: invalidarLoja });
  const alternando = fechar.isPending || abrir.isPending;

  if (semLoja && location.pathname !== '/comerciante/loja') {
    return <Navigate to="/comerciante/loja" replace />;
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-10 sm:p-6">
      <section className="card p-5 sm:p-6">
        {lojaQ.isLoading ? (
          <div className="h-12 animate-pulse rounded-xl bg-canvas-line/60" />
        ) : semLoja ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-ink">Bem-vindo ao seu painel</h1>
              <p className="mt-0.5 text-sm text-ink-soft">Falta cadastrar sua loja para começar a vender.</p>
            </div>
            <NavLink to="/comerciante/loja" className="btn btn-primary shrink-0">
              Cadastrar loja
            </NavLink>
          </div>
        ) : (
          loja && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="lbl">Sua loja</p>
                <h1 className="truncate text-2xl font-extrabold text-ink">{loja.nome_fantasia}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
                      loja.ativo ? 'bg-leaf-50 text-leaf-dark' : 'bg-danger-50 text-danger-dark'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${loja.ativo ? 'bg-leaf' : 'bg-danger'}`} />
                    {loja.ativo ? 'Aberta' : 'Fechada'}
                  </span>
                  {pendentes > 0 && (
                    <span className="text-sm font-semibold text-ink-soft">
                      {pendentes} pedido{pendentes > 1 ? 's' : ''} em aberto
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={alternando}
                onClick={() => (loja.ativo ? fechar.mutate() : abrir.mutate())}
                className={`btn shrink-0 ${loja.ativo ? 'btn-outline hover:border-danger hover:text-danger' : 'btn-primary'}`}
              >
                {loja.ativo ? 'Fechar loja' : 'Reabrir loja'}
              </button>
            </div>
          )
        )}
      </section>

      {!lojaQ.isLoading && !semLoja && (
        <div className="mt-5 inline-flex gap-1 rounded-full bg-canvas p-1">
          <NavLink to="/comerciante" end className={aba}>
            Pedidos
            {pendentes > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-citrus px-1 text-xs font-extrabold text-ink">
                {pendentes}
              </span>
            )}
          </NavLink>
          <NavLink to="/comerciante/cardapio" className={aba}>
            Cardápio
          </NavLink>
          <NavLink to="/comerciante/loja" className={aba}>
            Loja
          </NavLink>
        </div>
      )}

      {!lojaQ.isLoading && (
        <div className="mt-5">
          <Outlet />
        </div>
      )}
    </main>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { Notificacao } from '@foodloop/lib';
import { dataHora } from '../../../lib/format';

const CHAVE = ['notificacoes'];

export function SinoNotificacoes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  const q = useQuery({
    queryKey: CHAVE,
    queryFn: () => api.notificacoes.listar(),
    // Mantém o badge em dia com os eventos de pedido.
    refetchInterval: 20_000,
  });
  const naoLidas = q.data?.naoLidas ?? 0;
  const itens = q.data?.itens ?? [];

  function invalidar() {
    void qc.invalidateQueries({ queryKey: CHAVE });
  }
  const marcar = useMutation({
    mutationFn: (id: number) => api.notificacoes.marcarLida(id),
    onSuccess: invalidar,
  });
  const lerTodas = useMutation({
    mutationFn: () => api.notificacoes.lerTodas(),
    onSuccess: invalidar,
  });

  function abrir(n: Notificacao) {
    if (!n.lida) marcar.mutate(n.id);
    if (n.deep_link) {
      setAberto(false);
      navigate(n.deep_link);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : 'Notificações'}
        className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-100"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-700"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-xs font-semibold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-surface-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-surface-200 p-3">
            <p className="font-medium text-ink-900">Notificações</p>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => lerTodas.mutate()}
                disabled={lerTodas.isPending}
                className="text-sm font-medium text-brand-700 disabled:opacity-60"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-auto">
            {itens.length === 0 && (
              <li className="p-4 text-center text-sm text-ink-500">Nenhuma notificação.</li>
            )}
            {itens.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => abrir(n)}
                  className={`flex w-full flex-col gap-0.5 border-b border-surface-100 p-3 text-left hover:bg-surface-50 ${
                    n.lida ? '' : 'bg-brand-50/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {!n.lida && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <span className="font-medium text-ink-900">{n.titulo}</span>
                  </span>
                  <span className="text-sm text-ink-700">{n.corpo}</span>
                  <span className="text-xs text-ink-500">{dataHora(n.data_envio)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

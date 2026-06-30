import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { AvaliacaoPerfilItem, ComentarioAvaliacao } from '@foodloop/lib';
import { NotaEstrelas } from '../../../components/ui/NotaEstrelas';
import { dataHora } from '../../../lib/format';
import { mensagemErro } from '../../../lib/erros';
import { useAuthStore } from '../../auth/store';

interface Props {
  estabelecimentoId: number;
}

function chave(estabelecimentoId: number) {
  return ['avaliacoes-estabelecimento', estabelecimentoId];
}

function Comentario({ comentario }: { comentario: ComentarioAvaliacao }) {
  const ehComerciante = comentario.autor.tipo === 'comerciante';
  return (
    <li className="rounded-xl bg-canvas px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-ink">{comentario.autor.nome}</span>
        {ehComerciante && (
          <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-bold text-leaf-dark">
            Estabelecimento
          </span>
        )}
        <span className="text-xs text-ink-mute">{dataHora(comentario.data_comentario)}</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{comentario.comentario}</p>
    </li>
  );
}

function FormComentario({
  avaliacaoId,
  estabelecimentoId,
}: {
  avaliacaoId: number;
  estabelecimentoId: number;
}) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState('');

  const enviar = useMutation({
    mutationFn: () => api.avaliacoes.comentar(avaliacaoId, { comentario: texto.trim() }),
    onSuccess: () => {
      setTexto('');
      void qc.invalidateQueries({ queryKey: chave(estabelecimentoId) });
    },
  });

  return (
    <form
      className="mt-2 flex items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (texto.trim()) enviar.mutate();
      }}
    >
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, 500))}
        placeholder="Responder..."
        className="campo flex-1"
        aria-label="Escrever comentário"
      />
      <button type="submit" disabled={!texto.trim() || enviar.isPending} className="btn btn-soft shrink-0">
        {enviar.isPending ? '...' : 'Enviar'}
      </button>
    </form>
  );
}

function Avaliacao({
  avaliacao,
  estabelecimentoId,
  logado,
}: {
  avaliacao: AvaliacaoPerfilItem;
  estabelecimentoId: number;
  logado: boolean;
}) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-extrabold text-ink">{avaliacao.autor.nome}</span>
        <NotaEstrelas nota={avaliacao.nota} />
      </div>
      <p className="text-xs text-ink-mute">{dataHora(avaliacao.data_avaliacao)}</p>
      {avaliacao.comentario && <p className="mt-2 text-ink-soft">{avaliacao.comentario}</p>}

      {avaliacao.comentarios.length > 0 && (
        <ul className="mt-3 grid gap-2 border-l-2 border-canvas-line pl-3">
          {avaliacao.comentarios.map((c) => (
            <Comentario key={c.id} comentario={c} />
          ))}
        </ul>
      )}

      {logado && <FormComentario avaliacaoId={avaliacao.id} estabelecimentoId={estabelecimentoId} />}
    </li>
  );
}

// Lista as avaliações do estabelecimento com a thread de comentários. Usuários
// autenticados podem responder; o back valida quem pode (autor ou dono).
export function AvaliacoesEstabelecimento({ estabelecimentoId }: Props) {
  const logado = useAuthStore((s) => s.usuario !== null);
  const avaliacoesQ = useQuery({
    queryKey: chave(estabelecimentoId),
    queryFn: () => api.avaliacoes.listarDoEstabelecimento(estabelecimentoId),
  });

  if (avaliacoesQ.isLoading) {
    return <div className="mt-3 h-20 animate-pulse rounded-2xl bg-canvas-line/60" aria-hidden />;
  }
  if (avaliacoesQ.isError) {
    return (
      <p className="mt-2 text-sm text-danger-dark">
        {mensagemErro(avaliacoesQ.error, 'Erro ao carregar avaliações')}
      </p>
    );
  }

  const avaliacoes = avaliacoesQ.data ?? [];
  if (avaliacoes.length === 0) {
    return <p className="mt-2 text-ink-soft">Este estabelecimento ainda não recebeu avaliações.</p>;
  }

  return (
    <ul className="mt-4 grid gap-3">
      {avaliacoes.map((a) => (
        <Avaliacao key={a.id} avaliacao={a} estabelecimentoId={estabelecimentoId} logado={logado} />
      ))}
    </ul>
  );
}

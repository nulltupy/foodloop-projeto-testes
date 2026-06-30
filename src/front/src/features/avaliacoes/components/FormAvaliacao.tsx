import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { Sheet } from '../../../components/ui/Sheet';
import { EstrelasInput } from '../../../components/ui/EstrelasInput';
import { mensagemErro } from '../../../lib/erros';

interface FormAvaliacaoProps {
  pedidoId: number;
  estabelecimentoNome: string;
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const MAX_COMENTARIO = 500;

export function FormAvaliacao({
  pedidoId,
  estabelecimentoNome,
  aberto,
  onFechar,
  onSucesso,
}: FormAvaliacaoProps) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');

  const enviar = useMutation({
    mutationFn: () =>
      api.avaliacoes.criar({
        id_pedido: pedidoId,
        nota,
        comentario: comentario.trim() || undefined,
      }),
    onSuccess: () => {
      setNota(0);
      setComentario('');
      onSucesso();
    },
  });

  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      titulo={`Avaliar ${estabelecimentoNome}`}
      rodape={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFechar} className="btn btn-outline">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => enviar.mutate()}
            disabled={nota === 0 || enviar.isPending}
            className="btn btn-primary"
          >
            {enviar.isPending ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div>
          <p className="mb-1 text-sm font-bold text-ink">Sua nota</p>
          <EstrelasInput valor={nota} onChange={setNota} />
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-bold text-ink">Comentário (opcional)</span>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value.slice(0, MAX_COMENTARIO))}
            rows={4}
            placeholder="Conte como foi sua experiência..."
            className="campo resize-none py-2"
          />
          <span className="text-right text-xs text-ink-mute">
            {comentario.length}/{MAX_COMENTARIO}
          </span>
        </label>

        {enviar.isError && (
          <p
            role="alert"
            className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
          >
            {mensagemErro(enviar.error, 'Não foi possível enviar sua avaliação')}
          </p>
        )}
      </div>
    </Sheet>
  );
}

interface NotaEstrelasProps {
  nota: number | null | undefined;
}

// Mostra 5 estrelas (meia estrela arredondada para cima) e a nota numérica.
export function NotaEstrelas({ nota }: NotaEstrelasProps) {
  if (nota === null || nota === undefined) {
    return <span className="text-sm text-ink-500">Sem avaliações</span>;
  }

  const cheias = Math.round(nota);
  const estrelas = [1, 2, 3, 4, 5].map((posicao) => (posicao <= cheias ? '★' : '☆')).join('');

  return (
    <span className="text-sm text-accent-500" aria-label={`Nota ${nota.toFixed(1)} de 5`} role="img">
      {estrelas} <span className="text-ink-500">{nota.toFixed(1)}</span>
    </span>
  );
}

interface NotaEstrelasProps {
  nota: number | null | undefined;
}

// Mostra 5 estrelas (meia estrela arredondada para cima) e a nota numérica.
export function NotaEstrelas({ nota }: NotaEstrelasProps) {
  if (nota === null || nota === undefined) {
    return <span className="text-xs font-medium text-ink-mute">Sem nota</span>;
  }

  const cheias = Math.round(nota);
  const estrelas = [1, 2, 3, 4, 5].map((posicao) => (posicao <= cheias ? '★' : '☆')).join('');

  return (
    <span
      className="inline-flex items-center gap-1 text-amber"
      aria-label={`Nota ${nota.toFixed(1)} de 5`}
      role="img"
    >
      <span className="text-sm leading-none">{estrelas}</span>
      <span className="text-xs font-bold text-ink-soft">{nota.toFixed(1)}</span>
    </span>
  );
}

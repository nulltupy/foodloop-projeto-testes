import { useState } from 'react';

interface EstrelasInputProps {
  valor: number;
  onChange: (nota: number) => void;
}

const NOTAS = [1, 2, 3, 4, 5];
const ROTULOS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Ótimo',
};

// Seletor de nota de 1 a 5 estrelas inteiras (sem meia). O hover dá o preview;
// fora do hover, mostra a nota escolhida.
export function EstrelasInput({ valor, onChange }: EstrelasInputProps) {
  const [hover, setHover] = useState(0);
  const ativo = hover || valor;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
        {NOTAS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'} — ${ROTULOS[n]}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl leading-none text-amber transition-transform hover:scale-110"
          >
            <span className={n <= ativo ? 'text-amber' : 'text-canvas-line'}>{n <= ativo ? '★' : '☆'}</span>
          </button>
        ))}
      </div>
      <span className="h-4 text-xs font-bold text-ink-soft">
        {ativo ? ROTULOS[ativo] : 'Toque para avaliar'}
      </span>
    </div>
  );
}

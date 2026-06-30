// Ícones de navegação — stroke fino, herdam currentColor. Tamanho via prop.
interface Props {
  className?: string;
}
const base = (className = 'h-6 w-6') => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function IconeCasa({ className }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconeSacola({ className }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function IconeUsuario({ className }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconeLoja({ className }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 11v9h14v-9" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

export function IconeCardapio({ className }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M4 6h11" />
      <path d="M4 12h11" />
      <path d="M4 18h7" />
      <circle cx="19" cy="6" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}

export function IconePacote({ className }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="M4 7l8 4 8-4" />
      <path d="M12 11v10" />
    </svg>
  );
}

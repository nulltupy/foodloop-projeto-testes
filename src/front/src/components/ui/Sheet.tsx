import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  // Ações fixas no rodapé (ex.: Salvar/Cancelar). Opcional.
  rodape?: ReactNode;
}

// Overlay único do app: bottom-sheet no mobile, diálogo centralizado no desktop.
// Esc e clique no backdrop fecham; foco entra no painel ao abrir; corpo trava o
// scroll enquanto aberto.
export function Sheet({ aberto, onFechar, titulo, children, rodape }: SheetProps) {
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    painelRef.current?.focus();
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onFechar();
      }}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onFechar}
        className="absolute inset-0 animate-fade bg-ink/40 backdrop-blur-[2px]"
      />

      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-md animate-sheet flex-col rounded-t-3xl bg-canvas-card shadow-sheet outline-none sm:max-h-[85vh] sm:rounded-3xl sm:shadow-card"
      >
        <div className="flex items-center justify-between gap-2 border-b border-canvas-line px-5 py-3.5">
          <h2 className="text-lg font-extrabold text-ink">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {rodape && <div className="border-t border-canvas-line px-5 py-3.5">{rodape}</div>}
      </div>
    </div>
  );
}

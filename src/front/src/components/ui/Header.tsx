import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';

// Iniciais do nome para o avatar (ex.: "Maria Silva" -> "MS").
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeiro = partes[0]?.[0] ?? '';
  const ultimo = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primeiro + ultimo).toUpperCase() || '?';
}

export function Header() {
  const usuario = useAuthStore((s) => s.usuario);
  const limpar = useAuthStore((s) => s.limpar);
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  function sair() {
    limpar();
    setAberto(false);
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-surface-200 bg-white px-4 py-3">
      <Link to="/" className="text-lg font-semibold text-brand-700">
        FoodLoop
      </Link>

      {usuario ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}
            aria-haspopup="menu"
            aria-expanded={aberto}
            aria-label="Abrir menu da conta"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 font-semibold text-white"
          >
            {iniciais(usuario.nome)}
          </button>

          {aberto && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg border border-surface-200 bg-white p-3 shadow-lg"
            >
              <p className="font-medium text-ink-900">{usuario.nome}</p>
              <p className="truncate text-sm text-ink-500">{usuario.email}</p>

              {usuario.tipo === 'comerciante' && (
                <nav className="mt-3 flex flex-col gap-1 border-t border-surface-200 pt-3">
                  <Link
                    to="/comerciante"
                    onClick={() => setAberto(false)}
                    className="rounded-md px-2 py-2 text-sm text-ink-700 hover:bg-surface-100"
                  >
                    Meus anúncios
                  </Link>
                </nav>
              )}

              <button
                type="button"
                onClick={sair}
                className="mt-3 min-h-11 w-full rounded-lg bg-danger-500 px-3 font-medium text-white"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/login"
          className="flex min-h-11 items-center rounded-lg bg-brand-500 px-4 font-medium text-white"
        >
          Entrar
        </Link>
      )}
    </header>
  );
}

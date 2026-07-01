import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';
import { SinoNotificacoes } from '../../features/notificacoes/components/SinoNotificacoes';
import { LogoSmall } from './Logo';

// Iniciais do nome para o avatar (ex.: "Maria Silva" -> "MS").
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeiro = partes[0]?.[0] ?? '';
  const ultimo = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primeiro + ultimo).toUpperCase() || '?';
}

function linkNav({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
    isActive ? 'bg-leaf-50 text-leaf-dark' : 'text-ink-soft hover:bg-canvas hover:text-ink'
  }`;
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

  const inicio = usuario?.tipo === 'comerciante' ? '/comerciante' : '/';

  return (
    <header className="sticky top-0 z-30 border-b border-canvas-line bg-canvas-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link to={inicio} className="flex items-center gap-2" aria-label="FoodLoop — início">
          <LogoSmall className="h-[70px] w-[70px]" />
          <span className="text-xl font-extrabold text-leaf-dark">
            FoodLoop<span className="text-citrus">.</span>
          </span>
        </Link>

        {/* Navegação primária (desktop). No mobile vira barra inferior. */}
        {usuario?.tipo === 'cliente' && (
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={linkNav}>
              Ofertas
            </NavLink>
            <NavLink to="/pedidos" className={linkNav}>
              Meus pedidos
            </NavLink>
          </nav>
        )}

        {usuario ? (
          <div className="flex items-center gap-1">
            <SinoNotificacoes />
            <div className="relative">
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}
                aria-haspopup="menu"
                aria-expanded={aberto}
                aria-label="Conta e perfil"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf font-bold text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
              >
                {iniciais(usuario.nome)}
              </button>

              {aberto && (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setAberto(false)}
                    className="fixed inset-0 z-0 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-2 w-60 origin-top-right animate-rise rounded-2xl border border-canvas-line bg-canvas-card p-2 shadow-card"
                  >
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">
                        {iniciais(usuario.nome)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{usuario.nome}</p>
                        <p className="truncate text-sm text-ink-mute">{usuario.email}</p>
                      </div>
                    </div>

                    <Link
                      to="/perfil"
                      onClick={() => setAberto(false)}
                      className="mt-1 flex items-center gap-2 rounded-xl border-t border-canvas-line px-3 py-2.5 pt-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-leaf-dark"
                    >
                      Meu perfil
                    </Link>
                    <button
                      type="button"
                      onClick={sair}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-50"
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

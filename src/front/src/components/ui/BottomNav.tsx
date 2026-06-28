import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';
import { IconeCasa, IconeSacola, IconeUsuario } from './icones';

const itens = [
  { to: '/', end: true, label: 'Ofertas', Icon: IconeCasa },
  { to: '/pedidos', end: false, label: 'Pedidos', Icon: IconeSacola },
  { to: '/perfil', end: false, label: 'Perfil', Icon: IconeUsuario },
];

// Barra de navegação inferior — só no mobile e só para o cliente.
// O comerciante navega pelas abas do painel.
export function BottomNav() {
  const usuario = useAuthStore((s) => s.usuario);
  if (usuario?.tipo !== 'cliente') return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-canvas-line bg-canvas-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <div className="mx-auto flex max-w-md">
        {itens.map(({ to, end, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors ${
                isActive ? 'text-leaf-dark' : 'text-ink-mute hover:text-ink-soft'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import type { TipoUsuario } from '@foodloop/lib';
import { useAuthStore } from '../store';

interface RotaProtegidaProps {
  // Quando informado, restringe a rota a um tipo de usuário.
  tipo?: TipoUsuario;
}

export function RotaProtegida({ tipo }: RotaProtegidaProps) {
  const usuario = useAuthStore((s) => s.usuario);

  if (!usuario) return <Navigate to="/login" replace />;
  if (tipo && usuario.tipo !== tipo) return <Navigate to="/" replace />;

  return <Outlet />;
}

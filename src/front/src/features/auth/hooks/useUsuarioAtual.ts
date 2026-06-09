import { useAuthStore } from '../store';

// Atalho de leitura da sessão atual para telas e componentes.
export function useUsuarioAtual() {
  const usuario = useAuthStore((s) => s.usuario);
  return {
    usuario,
    autenticado: usuario !== null,
    isComerciante: usuario?.tipo === 'comerciante',
  };
}

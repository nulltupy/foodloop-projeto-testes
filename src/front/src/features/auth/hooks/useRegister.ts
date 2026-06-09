import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type RegisterRequest } from '@foodloop/lib';
import { useAuthStore } from '../store';

// Extrai o código de erro padronizado da resposta da API, se houver.
function codigoErro(e: unknown): string | undefined {
  const resp = (e as { response?: { data?: { error?: { code?: string } } } }).response;
  return resp?.data?.error?.code;
}

// Lógica compartilhada pelas telas de cadastro de cliente e comerciante.
export function useRegister() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar(dados: RegisterRequest) {
    setErro(null);
    try {
      const { usuario, token } = await api.auth.register(dados);
      setSession(usuario, token);
      navigate(usuario.tipo === 'comerciante' ? '/comerciante' : '/', { replace: true });
    } catch (e) {
      setErro(
        codigoErro(e) === 'CADASTRO_DUPLICADO'
          ? 'E-mail ou CNPJ já cadastrado.'
          : 'Não foi possível concluir o cadastro. Tente novamente.',
      );
    }
  }

  return { registrar, erro };
}

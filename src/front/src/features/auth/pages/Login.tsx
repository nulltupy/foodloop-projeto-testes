import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { api, LoginRequestSchema, type LoginRequest } from '@foodloop/lib';
import { useAuthStore } from '../store';

export function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(LoginRequestSchema) });

  async function aoEnviar(dados: LoginRequest) {
    setErroGeral(null);
    try {
      const { usuario, token } = await api.auth.login(dados);
      setSession(usuario, token);
      navigate(usuario.tipo === 'comerciante' ? '/comerciante' : '/', { replace: true });
    } catch {
      // Mensagem genérica: não revela se o e-mail existe.
      setErroGeral('E-mail ou senha inválidos.');
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="text-2xl font-semibold text-brand-700">Entrar</h1>

      <form onSubmit={handleSubmit(aoEnviar)} className="mt-6 flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-medium text-ink-900">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="min-h-11 rounded-lg border border-surface-200 px-3"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-danger-600">Informe um e-mail válido.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="senha" className="font-medium text-ink-900">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            className="min-h-11 rounded-lg border border-surface-200 px-3"
            {...register('senha')}
          />
          {errors.senha && <p className="text-sm text-danger-600">Informe a senha.</p>}
        </div>

        {erroGeral && (
          <p role="alert" className="text-sm text-danger-600">
            {erroGeral}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-lg bg-brand-500 px-4 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-500">
        Não tem conta?{' '}
        <Link to="/cadastro/cliente" className="font-medium text-brand-700">
          Criar conta
        </Link>
      </p>
    </main>
  );
}

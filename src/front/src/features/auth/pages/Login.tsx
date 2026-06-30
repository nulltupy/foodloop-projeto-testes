import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { api, LoginRequestSchema, type LoginRequest } from '@foodloop/lib';
import { useAuthStore } from '../store';
import { LogoBig } from '../../../components/ui/Logo';

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
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-md flex-col justify-center p-6">
      <div className="card animate-rise p-7 sm:p-9">
        <div className="text-center">
          <LogoBig className="mx-auto h-20 w-auto" />
          <h1 className="mt-4 text-3xl font-extrabold text-ink">Que bom te ver</h1>
          <p className="mt-1.5 text-ink-soft">Entre e resgate comida boa pertinho de você.</p>
        </div>

        <form onSubmit={handleSubmit(aoEnviar)} className="mt-7 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-bold text-ink-soft">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className="campo"
              {...register('email')}
            />
            {errors.email && <p className="text-sm font-semibold text-danger">Informe um e-mail válido.</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-bold text-ink-soft">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="campo"
              {...register('senha')}
            />
            {errors.senha && <p className="text-sm font-semibold text-danger">Informe a senha.</p>}
          </div>

          {erroGeral && (
            <p
              role="alert"
              className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
            >
              {erroGeral}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-1 w-full text-base">
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-ink-soft">
        <span>Novo por aqui?</span>
        <Link to="/cadastro/cliente" className="font-bold text-leaf-dark underline-offset-2 hover:underline">
          Cliente
        </Link>
        <Link
          to="/cadastro/comerciante"
          className="font-bold text-leaf-dark underline-offset-2 hover:underline"
        >
          Comerciante
        </Link>
      </div>
    </main>
  );
}

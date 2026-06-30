import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { RegisterRequestSchema, type RegisterRequest } from '@foodloop/lib';
import { useRegister } from '../hooks/useRegister';

export function CadastroCliente() {
  const { registrar, erro } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: { tipo: 'cliente' },
  });

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-extrabold text-ink">Criar conta</h1>
      <p className="mt-1 text-sm text-ink-mute">Cadastro de cliente</p>

      <form onSubmit={handleSubmit(registrar)} className="card mt-6 flex flex-col gap-4 p-6" noValidate>
        <input type="hidden" value="cliente" {...register('tipo')} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className="text-sm font-bold text-ink-soft">
            Nome
          </label>
          <input id="nome" className="campo" {...register('nome')} />
          {errors.nome && <p className="text-sm font-semibold text-danger">Informe seu nome.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold text-ink-soft">
            E-mail
          </label>
          <input id="email" type="email" autoComplete="email" className="campo" {...register('email')} />
          {errors.email && <p className="text-sm font-semibold text-danger">Informe um e-mail válido.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="telefone" className="text-sm font-bold text-ink-soft">
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            autoComplete="tel"
            placeholder="+5511999999999"
            className="campo"
            {...register('telefone')}
          />
          {errors.telefone && (
            <p className="text-sm font-semibold text-danger">Use o formato +55DDDNUMERO.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="senha" className="text-sm font-bold text-ink-soft">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            className="campo"
            {...register('senha')}
          />
          {errors.senha && (
            <p className="text-sm font-semibold text-danger">A senha precisa de ao menos 8 caracteres.</p>
          )}
        </div>

        {erro && (
          <p
            role="alert"
            className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
          >
            {erro}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-1 w-full text-base">
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        É um estabelecimento?{' '}
        <Link to="/cadastro/comerciante" className="font-bold text-leaf-dark hover:underline">
          Cadastre seu comércio
        </Link>
      </p>
    </main>
  );
}

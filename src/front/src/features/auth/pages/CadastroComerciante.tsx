import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { RegisterRequestSchema, type RegisterRequest } from '@foodloop/lib';
import { useRegister } from '../hooks/useRegister';

const campo = 'min-h-11 rounded-lg border border-surface-200 px-3';

export function CadastroComerciante() {
  const { registrar, erro } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: { tipo: 'comerciante' },
  });

  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="text-2xl font-semibold text-brand-700">Cadastrar comércio</h1>
      <p className="mt-1 text-sm text-ink-500">Cadastro de comerciante</p>

      <form onSubmit={handleSubmit(registrar)} className="mt-6 flex flex-col gap-4" noValidate>
        <input type="hidden" value="comerciante" {...register('tipo')} />

        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="font-medium text-ink-900">
            Nome do responsável
          </label>
          <input id="nome" className={campo} {...register('nome')} />
          {errors.nome && <p className="text-sm text-danger-600">Informe o nome.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-medium text-ink-900">
            E-mail
          </label>
          <input id="email" type="email" autoComplete="email" className={campo} {...register('email')} />
          {errors.email && <p className="text-sm text-danger-600">Informe um e-mail válido.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cnpj" className="font-medium text-ink-900">
            CNPJ
          </label>
          <input
            id="cnpj"
            inputMode="numeric"
            placeholder="14 dígitos"
            className={campo}
            {...register('cnpj')}
          />
          {errors.cnpj && <p className="text-sm text-danger-600">Informe um CNPJ com 14 dígitos.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="telefone" className="font-medium text-ink-900">
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            autoComplete="tel"
            placeholder="+5511999999999"
            className={campo}
            {...register('telefone')}
          />
          {errors.telefone && <p className="text-sm text-danger-600">Use o formato +55DDDNUMERO.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="senha" className="font-medium text-ink-900">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            className={campo}
            {...register('senha')}
          />
          {errors.senha && (
            <p className="text-sm text-danger-600">A senha precisa de ao menos 8 caracteres.</p>
          )}
        </div>

        {erro && (
          <p role="alert" className="text-sm text-danger-600">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-lg bg-brand-500 px-4 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Criando...' : 'Cadastrar comércio'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-500">
        Quer comprar?{' '}
        <Link to="/cadastro/cliente" className="font-medium text-brand-700">
          Criar conta de cliente
        </Link>
      </p>
    </main>
  );
}

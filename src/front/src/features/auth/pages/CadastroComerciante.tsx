import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { api, ErrorCode, RegisterComercianteRequestSchema } from '@foodloop/lib';
import type { RegisterComercianteRequest } from '@foodloop/lib';
import { codigoErro, mensagemErro } from '../../../lib/erros';
import { useAuthStore } from '../store';

const ContaSchema = RegisterComercianteRequestSchema.omit({ estabelecimento: true })
  .extend({
    confirmarSenha: z.string().min(1),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmarSenha'],
  });
const LojaSchema = RegisterComercianteRequestSchema.shape.estabelecimento;

type ContaForm = z.infer<typeof ContaSchema>;
type LojaForm = z.infer<typeof LojaSchema>;

const rotulo = 'text-sm font-bold text-ink-soft';
const erro = 'text-sm font-semibold text-danger';

const lojaVazia: LojaForm = {
  nome_fantasia: '',
  descricao: '',
  endereco: {
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  },
};

function normalizarLoja(loja: LojaForm): LojaForm {
  return {
    nome_fantasia: loja.nome_fantasia.trim(),
    descricao: loja.descricao?.trim() || undefined,
    endereco: {
      rua: loja.endereco.rua.trim(),
      numero: loja.endereco.numero.trim(),
      bairro: loja.endereco.bairro.trim(),
      cidade: loja.endereco.cidade.trim(),
      estado: loja.endereco.estado.trim().toUpperCase(),
      cep: loja.endereco.cep.trim(),
    },
  };
}

function textoErroCadastro(e: unknown): string {
  if (codigoErro(e) === ErrorCode.CADASTRO_DUPLICADO) return 'E-mail ou CNPJ já cadastrado.';
  return mensagemErro(e, 'Não foi possível concluir o cadastro. Tente novamente.');
}

export function CadastroComerciante() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [etapa, setEtapa] = useState<'conta' | 'loja'>('conta');
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<'idle' | 'buscando' | 'nao_encontrado'>('idle');
  const ultimoCep = useRef('');

  const conta = useForm<ContaForm>({
    resolver: zodResolver(ContaSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      cnpj: '',
      senha: '',
      confirmarSenha: '',
    },
  });
  const loja = useForm<LojaForm>({
    resolver: zodResolver(LojaSchema),
    defaultValues: lojaVazia,
  });

  function continuar() {
    setErroGeral(null);
    setEtapa('loja');
  }

  async function buscarCep(cepRaw: string) {
    const digitos = cepRaw.replace(/\D/g, '');
    if (digitos.length !== 8 || digitos === ultimoCep.current) return;
    ultimoCep.current = digitos;
    setCepStatus('buscando');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const d = (await r.json()) as {
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean | string;
      };
      const achou = d.erro !== true && d.erro !== 'true' && Boolean(d.localidade);
      if (!achou) {
        setCepStatus('nao_encontrado');
        return;
      }
      loja.setValue('endereco.rua', d.logradouro || loja.getValues('endereco.rua'), {
        shouldValidate: true,
      });
      loja.setValue('endereco.bairro', d.bairro || loja.getValues('endereco.bairro'), {
        shouldValidate: true,
      });
      loja.setValue('endereco.cidade', d.localidade || loja.getValues('endereco.cidade'), {
        shouldValidate: true,
      });
      loja.setValue('endereco.estado', d.uf || loja.getValues('endereco.estado'), {
        shouldValidate: true,
      });
      setCepStatus('idle');
    } catch {
      ultimoCep.current = '';
      setCepStatus('idle');
    }
  }

  async function finalizar(lojaDados: LojaForm) {
    setErroGeral(null);
    const contaValida = ContaSchema.safeParse(conta.getValues());
    if (!contaValida.success) {
      setEtapa('conta');
      return;
    }

    const { confirmarSenha: _confirmarSenha, ...dadosConta } = contaValida.data;
    const payload: RegisterComercianteRequest = {
      ...dadosConta,
      estabelecimento: normalizarLoja(lojaDados),
    };

    try {
      const { usuario, token } = await api.auth.registerComerciante(payload);
      setSession(usuario, token);
      navigate('/comerciante/cardapio', { replace: true });
    } catch (e) {
      setErroGeral(textoErroCadastro(e));
    }
  }

  const contaErrors = conta.formState.errors;
  const lojaErrors = loja.formState.errors;
  const enviando = loja.formState.isSubmitting;

  return (
    <main className="mx-auto w-full max-w-2xl p-4 pb-10 sm:p-6">
      <section className="card p-5 sm:p-7">
        <div>
          <p className="lbl">Comerciante</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Crie sua conta e loja</h1>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span
            className={`rounded-full px-3 py-2 text-center text-sm font-extrabold ${
              etapa === 'conta' ? 'bg-leaf text-white' : 'bg-leaf-50 text-leaf-dark'
            }`}
          >
            1 Conta
          </span>
          <span className="h-px w-10 bg-canvas-line" />
          <span
            className={`rounded-full px-3 py-2 text-center text-sm font-extrabold ${
              etapa === 'loja' ? 'bg-leaf text-white' : 'bg-canvas text-ink-mute'
            }`}
          >
            2 Loja
          </span>
        </div>

        {etapa === 'conta' ? (
          <form onSubmit={conta.handleSubmit(continuar)} className="mt-6 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="nome" className={rotulo}>
                Nome do responsável
              </label>
              <input id="nome" className="campo" autoComplete="name" {...conta.register('nome')} />
              {contaErrors.nome && <p className={erro}>Informe o nome.</p>}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="email" className={rotulo}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="campo"
                {...conta.register('email')}
              />
              {contaErrors.email && <p className={erro}>Informe um e-mail válido.</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="telefone" className={rotulo}>
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+5511999999999"
                  className="campo"
                  {...conta.register('telefone')}
                />
                {contaErrors.telefone && <p className={erro}>Use o formato +55DDDNUMERO.</p>}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="cnpj" className={rotulo}>
                  CNPJ
                </label>
                <input
                  id="cnpj"
                  inputMode="numeric"
                  placeholder="14 dígitos"
                  className="campo"
                  {...conta.register('cnpj')}
                />
                {contaErrors.cnpj && <p className={erro}>Informe um CNPJ com 14 dígitos.</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="senha" className={rotulo}>
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  className="campo"
                  {...conta.register('senha')}
                />
                {contaErrors.senha && <p className={erro}>A senha precisa de ao menos 8 caracteres.</p>}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="confirmarSenha" className={rotulo}>
                  Confirmar senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  className="campo"
                  {...conta.register('confirmarSenha')}
                />
                {contaErrors.confirmarSenha && <p className={erro}>As senhas precisam ser iguais.</p>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary justify-self-end px-6">
              Continuar
            </button>
          </form>
        ) : (
          <form onSubmit={loja.handleSubmit(finalizar)} className="mt-6 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="nome_fantasia" className={rotulo}>
                Nome da loja
              </label>
              <input
                id="nome_fantasia"
                className="campo"
                maxLength={120}
                {...loja.register('nome_fantasia')}
              />
              {lojaErrors.nome_fantasia && <p className={erro}>Informe o nome da loja.</p>}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="descricao" className={rotulo}>
                Descrição curta
              </label>
              <textarea
                id="descricao"
                className="campo py-2.5"
                rows={2}
                maxLength={500}
                {...loja.register('descricao')}
              />
              {lojaErrors.descricao && <p className={erro}>Use no máximo 500 caracteres.</p>}
            </div>

            <fieldset className="rounded-xl border border-canvas-line bg-canvas p-3.5">
              <legend className="px-1.5 text-sm font-bold text-ink">Endereço</legend>

              <div className="mt-3 grid gap-1.5 sm:max-w-[12rem]">
                <label htmlFor="cep" className={rotulo}>
                  CEP
                </label>
                <input
                  id="cep"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  className="campo"
                  {...loja.register('endereco.cep', {
                    onChange: (e) => {
                      const valor = String(e.target.value);
                      const digitos = valor.replace(/\D/g, '');
                      if (digitos.length === 8) void buscarCep(valor);
                      else {
                        ultimoCep.current = '';
                        if (cepStatus !== 'idle') setCepStatus('idle');
                      }
                    },
                    onBlur: (e) => void buscarCep(String(e.target.value)),
                  })}
                />
                {cepStatus === 'buscando' && <span className="text-xs text-ink-mute">Buscando...</span>}
                {cepStatus === 'nao_encontrado' && (
                  <span className="text-xs text-danger">CEP não encontrado</span>
                )}
                {lojaErrors.endereco?.cep && <p className={erro}>CEP inválido.</p>}
              </div>

              <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="rua" className={rotulo}>
                    Rua
                  </label>
                  <input id="rua" className="campo" maxLength={120} {...loja.register('endereco.rua')} />
                  {lojaErrors.endereco?.rua && <p className={erro}>Informe a rua.</p>}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="numero" className={rotulo}>
                    Número
                  </label>
                  <input
                    id="numero"
                    className="campo"
                    placeholder="Nº ou S/N"
                    maxLength={10}
                    {...loja.register('endereco.numero')}
                  />
                  {lojaErrors.endereco?.numero && <p className={erro}>Informe o número.</p>}
                </div>
              </div>

              <div className="mt-3 grid gap-1.5">
                <label htmlFor="bairro" className={rotulo}>
                  Bairro
                </label>
                <input id="bairro" className="campo" maxLength={80} {...loja.register('endereco.bairro')} />
                {lojaErrors.endereco?.bairro && <p className={erro}>Informe o bairro.</p>}
              </div>

              <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="cidade" className={rotulo}>
                    Cidade
                  </label>
                  <input id="cidade" className="campo" maxLength={80} {...loja.register('endereco.cidade')} />
                  {lojaErrors.endereco?.cidade && <p className={erro}>Informe a cidade.</p>}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="estado" className={rotulo}>
                    UF
                  </label>
                  <input
                    id="estado"
                    className="campo uppercase"
                    maxLength={2}
                    {...loja.register('endereco.estado', {
                      onChange: (e) => {
                        e.target.value = String(e.target.value).toUpperCase();
                      },
                    })}
                  />
                  {lojaErrors.endereco?.estado && <p className={erro}>UF inválida.</p>}
                </div>
              </div>
            </fieldset>

            {erroGeral && (
              <p
                role="alert"
                className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
              >
                {erroGeral}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setEtapa('conta')} className="btn btn-outline">
                Voltar
              </button>
              <button type="submit" disabled={enviando} className="btn btn-primary">
                {enviando ? 'Criando...' : 'Criar conta e loja'}
              </button>
            </div>
          </form>
        )}
      </section>

      <p className="mt-4 text-sm text-ink-soft">
        Quer comprar?{' '}
        <Link to="/cadastro/cliente" className="font-bold text-leaf-dark hover:underline">
          Criar conta de cliente
        </Link>
      </p>
    </main>
  );
}

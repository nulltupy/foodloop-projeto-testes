import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { CreateEstabelecimentoRequest, Estabelecimento } from '@foodloop/lib';
import { mensagemErro, statusErro } from '../../../lib/erros';

const CHAVE = ['estabelecimento-meu'];
const campo = 'mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base';
const cepRegex = /^\d{5}-?\d{3}$/;

interface FormLoja {
  nome_fantasia: string;
  descricao: string;
  horario_funcionamento: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

const FORM_VAZIO: FormLoja = {
  nome_fantasia: '',
  descricao: '',
  horario_funcionamento: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
};

function deLoja(e: Estabelecimento): FormLoja {
  return {
    nome_fantasia: e.nome_fantasia,
    descricao: e.descricao ?? '',
    horario_funcionamento: e.horario_funcionamento ?? '',
    rua: e.endereco.rua,
    numero: e.endereco.numero,
    bairro: e.endereco.bairro,
    cidade: e.endereco.cidade,
    estado: e.endereco.estado,
    cep: e.endereco.cep,
  };
}

function validar(f: FormLoja): string | null {
  if (!f.nome_fantasia.trim()) return 'Informe o nome da loja';
  if (!f.rua.trim() || !f.numero.trim() || !f.bairro.trim() || !f.cidade.trim())
    return 'Preencha o endereço completo';
  if (f.estado.trim().length !== 2) return 'UF deve ter 2 letras';
  if (!cepRegex.test(f.cep.trim())) return 'CEP inválido (use 00000-000)';
  return null;
}

function paraRequest(f: FormLoja): CreateEstabelecimentoRequest {
  return {
    nome_fantasia: f.nome_fantasia.trim(),
    descricao: f.descricao.trim() || undefined,
    horario_funcionamento: f.horario_funcionamento.trim() || undefined,
    endereco: {
      rua: f.rua.trim(),
      numero: f.numero.trim(),
      bairro: f.bairro.trim(),
      cidade: f.cidade.trim(),
      estado: f.estado.trim().toUpperCase(),
      cep: f.cep.trim(),
    },
  };
}

function FormularioLoja({
  inicial,
  rotuloEnviar,
  enviando,
  erroServidor,
  onEnviar,
  onCancelar,
}: {
  inicial: FormLoja;
  rotuloEnviar: string;
  enviando: boolean;
  erroServidor: string | null;
  onEnviar: (data: CreateEstabelecimentoRequest) => void;
  onCancelar?: () => void;
}) {
  const [form, setForm] = useState<FormLoja>(inicial);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof FormLoja>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalido = validar(form);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro(null);
    onEnviar(paraRequest(form));
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3">
      <label className="text-sm">
        Nome da loja
        <input
          type="text"
          value={form.nome_fantasia}
          onChange={(e) => set('nome_fantasia', e.target.value)}
          className={campo}
          maxLength={120}
          required
        />
      </label>

      <label className="text-sm">
        Descrição (opcional)
        <textarea
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          className={campo}
          rows={2}
          maxLength={500}
        />
      </label>

      <label className="text-sm">
        Horário de funcionamento (opcional)
        <input
          type="text"
          value={form.horario_funcionamento}
          onChange={(e) => set('horario_funcionamento', e.target.value)}
          className={campo}
          placeholder="Ex: 11:00 às 22:00"
          maxLength={120}
        />
      </label>

      <fieldset className="rounded-md border border-surface-200 bg-surface-50 p-3">
        <legend className="px-1 text-sm font-medium text-ink-900">Endereço</legend>
        <p className="px-1 text-xs text-ink-500">
          A localização no mapa é calculada automaticamente a partir do endereço.
        </p>

        <div className="mt-2 grid grid-cols-[2fr_1fr] gap-3">
          <label className="text-sm">
            Rua
            <input
              type="text"
              value={form.rua}
              onChange={(e) => set('rua', e.target.value)}
              className={campo}
              maxLength={120}
              required
            />
          </label>
          <label className="text-sm">
            Número
            <input
              type="text"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              className={campo}
              maxLength={10}
              required
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          Bairro
          <input
            type="text"
            value={form.bairro}
            onChange={(e) => set('bairro', e.target.value)}
            className={campo}
            maxLength={80}
            required
          />
        </label>

        <div className="mt-3 grid grid-cols-[2fr_1fr_1fr] gap-3">
          <label className="text-sm">
            Cidade
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => set('cidade', e.target.value)}
              className={campo}
              maxLength={80}
              required
            />
          </label>
          <label className="text-sm">
            UF
            <input
              type="text"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value.toUpperCase())}
              className={`${campo} uppercase`}
              maxLength={2}
              required
            />
          </label>
          <label className="text-sm">
            CEP
            <input
              type="text"
              value={form.cep}
              onChange={(e) => set('cep', e.target.value)}
              className={campo}
              placeholder="00000-000"
              maxLength={9}
              required
            />
          </label>
        </div>
      </fieldset>

      {(erro || erroServidor) && (
        <div role="alert" className="rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600">
          {erro ?? erroServidor}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 flex-1 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
        >
          {enviando ? 'Salvando…' : rotuloEnviar}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-11 rounded-lg border border-surface-300 px-4 font-medium text-ink-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function PainelLoja() {
  const qc = useQueryClient();
  const lojaQ = useQuery({ queryKey: CHAVE, queryFn: () => api.estabelecimentos.getMeu(), retry: false });
  const semLoja = lojaQ.isError && statusErro(lojaQ.error) === 404;

  const [editando, setEditando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  function invalidar() {
    void qc.invalidateQueries({ queryKey: CHAVE });
  }

  const criar = useMutation({
    mutationFn: (data: CreateEstabelecimentoRequest) => api.estabelecimentos.criar(data),
    onSuccess: () => {
      setErroServidor(null);
      invalidar();
    },
    onError: (e) => setErroServidor(mensagemErro(e, 'Não foi possível cadastrar a loja')),
  });

  const atualizar = useMutation({
    mutationFn: (data: CreateEstabelecimentoRequest) => api.estabelecimentos.atualizar(data),
    onSuccess: () => {
      setErroServidor(null);
      setEditando(false);
      invalidar();
    },
    onError: (e) => setErroServidor(mensagemErro(e, 'Não foi possível salvar as alterações')),
  });

  const fechar = useMutation({
    mutationFn: () => api.estabelecimentos.fechar(),
    onSuccess: invalidar,
  });
  const abrir = useMutation({
    mutationFn: () => api.estabelecimentos.abrir(),
    onSuccess: invalidar,
  });

  if (lojaQ.isLoading) {
    return <div className="mx-auto m-4 h-64 max-w-3xl animate-pulse rounded-lg bg-surface-100" />;
  }

  if (lojaQ.isError && !semLoja) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="rounded-md bg-danger-500/10 p-3 text-sm text-danger-600">
          Não foi possível carregar sua loja. Tente novamente.
        </div>
      </main>
    );
  }

  if (semLoja) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold text-brand-700">Cadastrar loja</h1>
        <p className="mt-1 text-sm text-ink-500">
          Cadastre os dados do seu comércio para começar a publicar ofertas.
        </p>
        <section className="mt-6 rounded-lg border border-surface-200 bg-white p-4">
          <FormularioLoja
            inicial={FORM_VAZIO}
            rotuloEnviar="Cadastrar loja"
            enviando={criar.isPending}
            erroServidor={erroServidor}
            onEnviar={(data) => criar.mutate(data)}
          />
        </section>
      </main>
    );
  }

  const loja = lojaQ.data!;
  const e = loja.endereco;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Minha loja</h1>

      <section className="mt-6 rounded-lg border border-surface-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-lg font-medium text-ink-900">{loja.nome_fantasia}</p>
            {loja.descricao && <p className="text-sm text-ink-700">{loja.descricao}</p>}
            {loja.horario_funcionamento && (
              <p className="mt-1 text-sm text-ink-500">{loja.horario_funcionamento}</p>
            )}
            <p className="mt-2 text-sm text-ink-500">
              {e.rua}, {e.numero} · {e.bairro} · {e.cidade}/{e.estado} · {e.cep}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              loja.ativo ? 'bg-brand-50 text-brand-700' : 'bg-danger-500/10 text-danger-600'
            }`}
          >
            {loja.ativo ? 'Aberta' : 'Fechada'}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!editando && (
            <button
              type="button"
              onClick={() => {
                setErroServidor(null);
                setEditando(true);
              }}
              className="min-h-11 rounded-lg border border-surface-300 px-4 font-medium text-ink-700"
            >
              Editar dados
            </button>
          )}
          {loja.ativo ? (
            <button
              type="button"
              onClick={() => fechar.mutate()}
              disabled={fechar.isPending}
              className="min-h-11 rounded-lg border border-danger-500 px-4 font-medium text-danger-600 disabled:opacity-60"
            >
              Fechar loja
            </button>
          ) : (
            <button
              type="button"
              onClick={() => abrir.mutate()}
              disabled={abrir.isPending}
              className="min-h-11 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
            >
              Reabrir loja
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Loja fechada não aparece nas buscas dos clientes e suas ofertas ficam ocultas.
        </p>
      </section>

      {editando && (
        <section className="mt-6 rounded-lg border border-surface-200 bg-white p-4">
          <h2 className="text-lg font-medium text-ink-900">Editar dados da loja</h2>
          <FormularioLoja
            inicial={deLoja(loja)}
            rotuloEnviar="Salvar alterações"
            enviando={atualizar.isPending}
            erroServidor={erroServidor}
            onEnviar={(data) => atualizar.mutate(data)}
            onCancelar={() => {
              setEditando(false);
              setErroServidor(null);
            }}
          />
        </section>
      )}
    </main>
  );
}

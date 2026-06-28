import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { CreateEstabelecimentoRequest, Estabelecimento } from '@foodloop/lib';
import { mensagemErro, statusErro } from '../../../lib/erros';

const CHAVE = ['estabelecimento-meu'];
const cepRegex = /^\d{5}-?\d{3}$/;
const rotulo = 'text-sm font-bold text-ink-soft';
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

interface FormLoja {
  nome_fantasia: string;
  descricao: string;
  abre: string;
  fecha: string;
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
  abre: '',
  fecha: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
};

// Zero-pad da hora pra casar com o formato HH:MM salvo na coluna legada.
function padHora(t: string): string {
  const [h, m] = t.split(':');
  return h && m ? `${h.padStart(2, '0')}:${m}` : '';
}

// Extrai abre/fecha de uma string legada ("11:00 às 22:00", "08:00-18:00", …).
function parseHorario(s: string | null | undefined): { abre: string; fecha: string } {
  const m = (s ?? '').match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
  return { abre: padHora(m?.[1] ?? ''), fecha: padHora(m?.[2] ?? '') };
}

function horarioParaString(abre: string, fecha: string): string {
  return `${abre}–${fecha}`;
}

function partesHorario(valor: string): { hora: string; minuto: string } {
  const [hora = '', minuto = ''] = valor.split(':');
  return { hora, minuto };
}

function montarHorario(hora: string, minuto: string): string {
  return hora && minuto ? `${hora}:${minuto}` : '';
}

function SeletorHorario({
  rotuloCampo,
  valor,
  onChange,
}: {
  rotuloCampo: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  const { hora, minuto } = partesHorario(valor);
  return (
    <label className="grid min-w-0 flex-1 gap-1.5">
      <span className={rotulo}>{rotuloCampo}</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <select
          aria-label={`${rotuloCampo}: hora`}
          value={hora}
          onChange={(e) => onChange(montarHorario(e.target.value, minuto))}
          className="campo min-w-0"
          required
        >
          <option value="">HH</option>
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="font-bold text-ink-mute">:</span>
        <select
          aria-label={`${rotuloCampo}: minuto`}
          value={minuto}
          onChange={(e) => onChange(montarHorario(hora, e.target.value))}
          className="campo min-w-0"
          required
        >
          <option value="">MM</option>
          {MINUTOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function deLoja(e: Estabelecimento): FormLoja {
  return {
    nome_fantasia: e.nome_fantasia,
    descricao: e.descricao ?? '',
    ...parseHorario(e.horario_funcionamento),
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
  if (!horarioRegex.test(f.abre) || !horarioRegex.test(f.fecha)) return 'Informe abertura e fechamento';
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
    horario_funcionamento: horarioParaString(f.abre, f.fecha),
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
  const [cepStatus, setCepStatus] = useState<'idle' | 'buscando' | 'ok' | 'nao_encontrado'>('idle');
  // Evita refazer a mesma busca (onChange + onBlur disparam no mesmo CEP).
  const ultimoCep = useRef('');

  function set<K extends keyof FormLoja>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Autocompleta o endereço a partir do CEP (ViaCEP). O back ainda geocodifica
  // as coordenadas no envio; aqui é só conveniência de preenchimento.
  async function buscarCep(cepRaw: string) {
    const digitos = cepRaw.replace(/\D/g, '');
    if (digitos.length !== 8 || digitos === ultimoCep.current) return;
    ultimoCep.current = digitos;
    setCepStatus('buscando');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      // ViaCEP devolve `{ "erro": "true" }` (string!) para CEP inexistente ou
      // genérico de cidade; um CEP de rua traz logradouro/localidade.
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
      setForm((f) => ({
        ...f,
        rua: d.logradouro || f.rua,
        bairro: d.bairro || f.bairro,
        cidade: d.localidade || f.cidade,
        estado: d.uf || f.estado,
      }));
      setCepStatus('ok');
    } catch {
      // Falha de rede: permite preencher manualmente sem travar.
      ultimoCep.current = '';
      setCepStatus('idle');
    }
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
    <form onSubmit={onSubmit} className="mt-4 grid gap-3.5">
      <label className="grid gap-1.5">
        <span className={rotulo}>Nome da loja</span>
        <input
          type="text"
          value={form.nome_fantasia}
          onChange={(e) => set('nome_fantasia', e.target.value)}
          className="campo"
          maxLength={120}
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className={rotulo}>Descrição (opcional)</span>
        <textarea
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          className="campo py-2.5"
          rows={2}
          maxLength={500}
        />
      </label>

      <div className="grid gap-1.5">
        <span className={rotulo}>Horário de funcionamento</span>
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <SeletorHorario rotuloCampo="Abre" valor={form.abre} onChange={(valor) => set('abre', valor)} />
          <span className="hidden pb-3 font-semibold text-ink-mute sm:block">às</span>
          <SeletorHorario rotuloCampo="Fecha" valor={form.fecha} onChange={(valor) => set('fecha', valor)} />
        </div>
      </div>

      <fieldset className="rounded-xl border border-canvas-line bg-canvas p-3.5">
        <legend className="px-1.5 text-sm font-bold text-ink">Endereço</legend>

        <label className="mt-3 grid gap-1.5">
          <span className={rotulo}>CEP</span>
          <input
            type="text"
            value={form.cep}
            onChange={(e) => {
              set('cep', e.target.value);
              const dig = e.target.value.replace(/\D/g, '');
              if (dig.length === 8) void buscarCep(e.target.value);
              else {
                ultimoCep.current = '';
                if (cepStatus !== 'idle') setCepStatus('idle');
              }
            }}
            onBlur={(e) => void buscarCep(e.target.value)}
            className="campo sm:max-w-[12rem]"
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            required
          />
          {cepStatus === 'buscando' && <span className="text-xs text-ink-mute">Buscando…</span>}
          {cepStatus === 'nao_encontrado' && <span className="text-xs text-danger">CEP não encontrado</span>}
        </label>

        <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
          <label className="grid gap-1.5">
            <span className={rotulo}>Rua</span>
            <input
              type="text"
              value={form.rua}
              onChange={(e) => set('rua', e.target.value)}
              className="campo"
              maxLength={120}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={rotulo}>Número</span>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              className="campo"
              placeholder="Nº ou S/N"
              maxLength={10}
              required
            />
          </label>
        </div>

        <label className="mt-3 grid gap-1.5">
          <span className={rotulo}>Bairro</span>
          <input
            type="text"
            value={form.bairro}
            onChange={(e) => set('bairro', e.target.value)}
            className="campo"
            maxLength={80}
            required
          />
        </label>

        <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
          <label className="grid gap-1.5">
            <span className={rotulo}>Cidade</span>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => set('cidade', e.target.value)}
              className="campo"
              maxLength={80}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={rotulo}>UF</span>
            <input
              type="text"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value.toUpperCase())}
              className="campo uppercase"
              maxLength={2}
              required
            />
          </label>
        </div>
      </fieldset>

      {(erro || erroServidor) && (
        <div
          role="alert"
          className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
        >
          {erro ?? erroServidor}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="btn btn-primary flex-1">
          {enviando ? 'Salvando…' : rotuloEnviar}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="btn btn-outline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function PainelLoja() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const lojaQ = useQuery({ queryKey: CHAVE, queryFn: () => api.estabelecimentos.getMeu(), retry: false });
  const semLoja = lojaQ.isError && statusErro(lojaQ.error) === 404;

  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  function invalidar() {
    void qc.invalidateQueries({ queryKey: CHAVE });
  }

  const criar = useMutation({
    mutationFn: (data: CreateEstabelecimentoRequest) => api.estabelecimentos.criar(data),
    onSuccess: (loja) => {
      setErroServidor(null);
      setSalvo(true);
      qc.setQueryData(CHAVE, loja);
      invalidar();
      navigate('/comerciante/cardapio', { replace: true });
    },
    onError: (e) => {
      setSalvo(false);
      setErroServidor(mensagemErro(e, 'Não foi possível cadastrar a loja'));
    },
  });

  const atualizar = useMutation({
    mutationFn: (data: CreateEstabelecimentoRequest) => api.estabelecimentos.atualizar(data),
    onSuccess: () => {
      setErroServidor(null);
      setSalvo(true);
      invalidar();
    },
    onError: (e) => {
      setSalvo(false);
      setErroServidor(mensagemErro(e, 'Não foi possível salvar as alterações'));
    },
  });

  if (lojaQ.isLoading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-canvas-line/60" />;
  }

  if (lojaQ.isError && !semLoja) {
    return (
      <div className="rounded-2xl bg-danger-50 p-4 text-sm font-semibold text-danger-dark">
        Não foi possível carregar sua loja. Tente novamente.
      </div>
    );
  }

  const loja = lojaQ.data;

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="text-lg font-extrabold text-ink">{semLoja ? 'Cadastre sua loja' : 'Dados da loja'}</h2>
      <p className="mt-0.5 text-sm text-ink-soft">
        {semLoja
          ? 'Preencha os dados para começar a publicar ofertas.'
          : 'Atualize as informações que os clientes veem. Abrir e fechar fica no topo do painel.'}
      </p>

      {salvo && !erroServidor && (
        <div className="mt-3 rounded-xl bg-leaf-50 px-3 py-2 text-sm font-semibold text-leaf-dark">
          Loja salva.
        </div>
      )}

      <FormularioLoja
        key={loja?.id ?? 'novo'}
        inicial={loja ? deLoja(loja) : FORM_VAZIO}
        rotuloEnviar={semLoja ? 'Cadastrar loja' : 'Salvar alterações'}
        enviando={criar.isPending || atualizar.isPending}
        erroServidor={erroServidor}
        onEnviar={(data) => {
          setSalvo(false);
          (semLoja ? criar : atualizar).mutate(data);
        }}
      />
    </section>
  );
}

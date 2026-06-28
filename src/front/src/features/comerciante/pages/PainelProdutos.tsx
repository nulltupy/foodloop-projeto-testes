import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { Anuncio, CreateProdutoRequest, Produto } from '@foodloop/lib';
import { Sheet } from '../../../components/ui/Sheet';

const CATEGORIAS = ['Lanche', 'Bebida', 'Sobremesa', 'Padaria', 'Refeição', 'Outros'];
const rotulo = 'text-sm font-bold text-ink-soft';
const acaoIcone =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-canvas-line text-ink-soft transition-colors';
const MINUTOS_DIA = 24 * 60;

interface OfertaForm {
  desconto: string;
  quantidade: string;
  prazoHoras: string;
  prazoMinutos: string;
}

interface OfertaValidada {
  desconto: number;
  quantidade: number;
  prazo: string;
}

interface Formulario {
  nome: string;
  descricao: string;
  preco_regular: string;
  categoria: string;
  imagem: string;
  desconto: string;
  quantidade: string;
  prazoHoras: string;
  prazoMinutos: string;
}

const OFERTA_VAZIA: OfertaForm = { desconto: '50', quantidade: '5', prazoHoras: '4', prazoMinutos: '0' };

const FORM_VAZIO: Formulario = {
  nome: '',
  descricao: '',
  preco_regular: '',
  categoria: 'Lanche',
  imagem: '',
  ...OFERTA_VAZIA,
};

const ANUNCIO_VAZIO: OfertaForm = OFERTA_VAZIA;

type Modal =
  | { tipo: 'novo' }
  | { tipo: 'editar'; produto: Produto }
  | { tipo: 'anunciar'; produto: Produto }
  | { tipo: 'excluir'; produto: Produto }
  | null;

function paraRequest(f: Formulario): CreateProdutoRequest {
  return {
    nome: f.nome.trim(),
    descricao: f.descricao.trim() || undefined,
    preco_regular: Number(f.preco_regular),
    categoria: f.categoria,
    imagem: f.imagem.trim() || undefined,
  };
}

function ofertaDeAnuncio(p: Produto, a: Anuncio): OfertaForm {
  const desconto = Math.round((1 - a.preco_promocional / p.preco_regular) * 100);
  const totalMinutos = Math.max(
    1,
    Math.min(MINUTOS_DIA - 1, Math.ceil((Date.parse(a.prazo_retirada) - Date.now()) / 60_000)),
  );
  return {
    desconto: String(Math.max(0, Math.min(100, desconto))),
    quantidade: String(a.quantidade_inicial),
    prazoHoras: String(Math.floor(totalMinutos / 60)),
    prazoMinutos: String(totalMinutos % 60),
  };
}

function deProduto(p: Produto, anuncio?: Anuncio): Formulario {
  return {
    ...FORM_VAZIO,
    ...(anuncio ? ofertaDeAnuncio(p, anuncio) : {}),
    nome: p.nome,
    descricao: p.descricao ?? '',
    preco_regular: String(p.preco_regular),
    categoria: p.categoria,
    imagem: p.imagem ?? '',
  };
}

function inteiroEmFaixa(valor: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(valor.trim())) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= min && numero <= max ? numero : null;
}

function descontoNumero(valor: string): number | null {
  return inteiroEmFaixa(valor, 0, 100);
}

function quantidadeNumero(valor: string): number | null {
  return inteiroEmFaixa(valor, 1, 999_999);
}

function prazoTotalMinutos(horasRaw: string, minutosRaw: string): number | null {
  const horas = inteiroEmFaixa(horasRaw, 0, 23);
  const minutos = inteiroEmFaixa(minutosRaw, 0, 59);
  if (horas === null || minutos === null) return null;
  const total = horas * 60 + minutos;
  return total > 0 && total < MINUTOS_DIA ? total : null;
}

function prazoIso(horasRaw: string, minutosRaw: string): string | null {
  const total = prazoTotalMinutos(horasRaw, minutosRaw);
  return total === null ? null : new Date(Date.now() + total * 60 * 1000).toISOString();
}

function validarOferta(f: OfertaForm): OfertaValidada | string {
  const desconto = descontoNumero(f.desconto);
  if (desconto === null) return 'Desconto deve ser um número inteiro entre 0 e 100';
  const quantidade = quantidadeNumero(f.quantidade);
  if (quantidade === null) return 'Quantidade precisa ser um número inteiro maior que zero';
  const prazo = prazoIso(f.prazoHoras, f.prazoMinutos);
  if (prazo === null) return 'Retirada deve ser maior que zero e menor que 24 horas';
  return { desconto, quantidade, prazo };
}

function precoComDesconto(precoRegular: string, desconto: number): number | null {
  const preco = Number(precoRegular);
  if (!Number.isFinite(preco) || preco <= 0) return null;
  return Math.max(0.01, Number((preco * (1 - desconto / 100)).toFixed(2)));
}

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarPrazo(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function IconeMais() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconeLapis() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" strokeLinejoin="round" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}
function IconeLixeira() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PreviaPreco({ regular, desconto }: { regular: number; desconto: number }) {
  const preco = precoComDesconto(String(regular), desconto);
  if (preco === null) return null;
  return (
    <p className="mt-2 flex items-baseline gap-2 text-sm text-ink-soft">
      Cliente paga <span className="nums text-lg font-extrabold text-leaf-dark">{moeda(preco)}</span>
      <span className="nums text-xs text-ink-mute line-through">{moeda(regular)}</span>
    </p>
  );
}

// Bloco "Oferta" reaproveitado em Novo produto e em Anunciar.
function CamposOferta({
  desconto,
  quantidade,
  prazoHoras,
  prazoMinutos,
  onChange,
}: {
  desconto: string;
  quantidade: string;
  prazoHoras: string;
  prazoMinutos: string;
  onChange: (patch: Partial<OfertaForm>) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={rotulo}>Desconto (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            value={desconto}
            onChange={(e) => onChange({ desconto: e.target.value })}
            className="campo"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className={rotulo}>Quantidade</span>
          <input
            type="number"
            min="1"
            step="1"
            value={quantidade}
            onChange={(e) => onChange({ quantidade: e.target.value })}
            className="campo"
            required
          />
        </label>
      </div>

      <div className="grid gap-1.5">
        <span className={rotulo}>Retirada até</span>
        <div className="grid max-w-sm grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
          <input
            aria-label="Horas para retirada"
            type="number"
            min="0"
            max="23"
            step="1"
            inputMode="numeric"
            value={prazoHoras}
            onChange={(e) => onChange({ prazoHoras: e.target.value })}
            className="campo min-w-0"
            required
          />
          <span className="text-xs font-bold text-ink-mute">h</span>
          <input
            aria-label="Minutos para retirada"
            type="number"
            min="0"
            max="59"
            step="1"
            inputMode="numeric"
            value={prazoMinutos}
            onChange={(e) => onChange({ prazoMinutos: e.target.value })}
            className="campo min-w-0"
            required
          />
          <span className="text-xs font-bold text-ink-mute">min</span>
        </div>
      </div>
    </div>
  );
}

export function PainelProdutos() {
  const qc = useQueryClient();
  const lista = useQuery({ queryKey: ['produtos-meus'], queryFn: () => api.produtos.listarMeus() });
  const anuncios = useQuery({ queryKey: ['anuncios-meus'], queryFn: () => api.anuncios.listarMeus() });

  function anuncioAtivoDe(produtoId: number) {
    return anuncios.data?.find((a) => a.id_produto === produtoId && a.status === 'ATIVO');
  }

  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [anuncioForm, setAnuncioForm] = useState(ANUNCIO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setModal(null);
    setErro(null);
  }

  function invalidar() {
    void qc.invalidateQueries({ queryKey: ['produtos-meus'] });
    void qc.invalidateQueries({ queryKey: ['anuncios'] });
    void qc.invalidateQueries({ queryKey: ['anuncios-meus'] });
  }

  const criar = useMutation({
    mutationFn: async (args: { form: Formulario; oferta: OfertaValidada }) => {
      const f = args.form;
      const produto = await api.produtos.criar(paraRequest(f));
      await api.anuncios.criar({
        id_produto: produto.id,
        preco_promocional: precoComDesconto(f.preco_regular, args.oferta.desconto)!,
        quantidade_inicial: args.oferta.quantidade,
        prazo_retirada: args.oferta.prazo,
      });
      return produto;
    },
    onSuccess: () => {
      fechar();
      invalidar();
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao criar produto'),
  });

  const atualizar = useMutation({
    mutationFn: async (args: {
      id: number;
      form: Formulario;
      anuncio?: Anuncio;
      oferta?: OfertaValidada;
    }) => {
      const produto = await api.produtos.atualizar(args.id, paraRequest(args.form));
      if (args.anuncio && args.oferta) {
        await api.anuncios.atualizar(args.anuncio.id, {
          preco_promocional: precoComDesconto(args.form.preco_regular, args.oferta.desconto)!,
          quantidade_inicial: args.oferta.quantidade,
          prazo_retirada: args.oferta.prazo,
        });
      }
      return produto;
    },
    onSuccess: () => {
      fechar();
      invalidar();
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao atualizar produto'),
  });

  const desativar = useMutation({
    mutationFn: (id: number) => api.produtos.desativar(id),
    onSuccess: () => {
      fechar();
      invalidar();
    },
    onError: () => setErro('Erro ao excluir produto'),
  });

  const anunciar = useMutation({
    mutationFn: (args: { produto: Produto; oferta: OfertaValidada }) => {
      return api.anuncios.criar({
        id_produto: args.produto.id,
        preco_promocional: precoComDesconto(String(args.produto.preco_regular), args.oferta.desconto)!,
        quantidade_inicial: args.oferta.quantidade,
        prazo_retirada: args.oferta.prazo,
      });
    },
    onSuccess: () => {
      fechar();
      invalidar();
    },
    onError: (e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao publicar anúncio'),
  });

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setErro(null);
    setModal({ tipo: 'novo' });
  }
  function abrirEditar(p: Produto) {
    setForm(deProduto(p, anuncioAtivoDe(p.id)));
    setErro(null);
    setModal({ tipo: 'editar', produto: p });
  }
  function abrirAnunciar(p: Produto) {
    setAnuncioForm(ANUNCIO_VAZIO);
    setErro(null);
    setModal({ tipo: 'anunciar', produto: p });
  }

  function submitProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.preco_regular) {
      setErro('Nome e preço são obrigatórios');
      return;
    }
    if (!Number.isFinite(Number(form.preco_regular)) || Number(form.preco_regular) <= 0) {
      setErro('Preço regular precisa ser maior que zero');
      return;
    }
    if (modal?.tipo === 'editar') {
      const anuncio = anuncioAtivoDe(modal.produto.id);
      const oferta = anuncio ? validarOferta(form) : undefined;
      if (typeof oferta === 'string') {
        setErro(oferta);
        return;
      }
      setErro(null);
      atualizar.mutate({ id: modal.produto.id, form, anuncio, oferta });
      return;
    }
    const oferta = validarOferta(form);
    if (typeof oferta === 'string') {
      setErro(oferta);
      return;
    }
    setErro(null);
    criar.mutate({ form, oferta });
  }

  function submitAnuncio(e: React.FormEvent) {
    e.preventDefault();
    if (modal?.tipo !== 'anunciar') return;
    const oferta = validarOferta(anuncioForm);
    if (typeof oferta === 'string') {
      setErro(oferta);
      return;
    }
    setErro(null);
    anunciar.mutate({ produto: modal.produto, oferta });
  }

  const salvando = criar.isPending || atualizar.isPending;
  const editando = modal?.tipo === 'editar';
  const anuncioEditando = modal?.tipo === 'editar' ? anuncioAtivoDe(modal.produto.id) : undefined;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-ink">Produtos cadastrados</h2>
        <button type="button" onClick={abrirNovo} className="btn btn-primary">
          <IconeMais /> Novo produto
        </button>
      </div>

      {lista.isLoading && (
        <ul className="grid gap-2.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-canvas-line/60" />
          ))}
        </ul>
      )}
      {lista.isError && (
        <div className="rounded-2xl bg-danger-50 p-3 text-sm font-semibold text-danger-dark">
          Não foi possível carregar seus produtos. Confirme que você está logado como comerciante.
        </div>
      )}
      {lista.data && lista.data.length === 0 && (
        <div className="card flex flex-col items-center p-8 text-center">
          <p className="text-lg font-extrabold text-ink">Cardápio vazio</p>
          <p className="mt-1 text-sm text-ink-soft">Cadastre seu primeiro produto e publique a oferta.</p>
          <button type="button" onClick={abrirNovo} className="btn btn-primary mt-5">
            <IconeMais /> Novo produto
          </button>
        </div>
      )}

      <ul className="grid gap-2.5">
        {lista.data?.map((p) => {
          const anuncio = anuncioAtivoDe(p.id);
          return (
            <li key={p.id} className="card flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-ink">{p.nome}</p>
                <p className="truncate text-sm text-ink-mute">
                  {moeda(p.preco_regular)} · {p.categoria}
                  {!p.ativo && ' · inativo'}
                </p>
                {anuncio ? (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
                    <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-dark">
                      {moeda(anuncio.preco_promocional)}
                    </span>
                    {anuncio.quantidade_disponivel} un · até {formatarPrazo(anuncio.prazo_retirada)}
                  </p>
                ) : (
                  p.ativo && <p className="mt-1 text-xs font-semibold text-ink-mute">Sem anúncio ativo</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {p.ativo && !anuncio && (
                  <button type="button" onClick={() => abrirAnunciar(p)} className="btn btn-soft h-11 px-3.5">
                    Anunciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => abrirEditar(p)}
                  aria-label={`Editar ${p.nome}`}
                  className={`${acaoIcone} hover:border-leaf-200 hover:text-leaf-dark`}
                >
                  <IconeLapis />
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ tipo: 'excluir', produto: p })}
                  aria-label={`Excluir ${p.nome}`}
                  className={`${acaoIcone} hover:border-danger hover:text-danger`}
                >
                  <IconeLixeira />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Popup: novo / editar produto */}
      <Sheet
        aberto={modal?.tipo === 'novo' || modal?.tipo === 'editar'}
        onFechar={fechar}
        titulo={editando ? 'Editar produto' : 'Novo produto'}
        rodape={
          <div className="flex gap-2">
            <button type="button" onClick={fechar} className="btn btn-outline flex-1">
              Cancelar
            </button>
            <button type="submit" form="form-produto" disabled={salvando} className="btn btn-primary flex-1">
              {editando ? 'Salvar' : 'Publicar oferta'}
            </button>
          </div>
        }
      >
        <form id="form-produto" onSubmit={submitProduto} className="grid gap-3.5">
          <label className="grid gap-1.5">
            <span className={rotulo}>Nome</span>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="campo"
              placeholder="Ex: Coxinha de Frango"
              required
              maxLength={120}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={rotulo}>Descrição (opcional)</span>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="campo py-2.5"
              rows={2}
              maxLength={500}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className={rotulo}>Preço regular (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.preco_regular}
                onChange={(e) => setForm({ ...form, preco_regular: e.target.value })}
                className="campo"
                placeholder="0,00"
                required
              />
            </label>
            <label className="grid gap-1.5">
              <span className={rotulo}>Categoria</span>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="campo"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className={rotulo}>URL da imagem (opcional)</span>
            <input
              type="url"
              value={form.imagem}
              onChange={(e) => setForm({ ...form, imagem: e.target.value })}
              className="campo"
              placeholder="https://..."
            />
          </label>

          {!editando && (
            <fieldset className="rounded-xl border border-canvas-line bg-canvas p-3.5">
              <legend className="px-1.5 text-sm font-bold text-ink">Oferta</legend>
              <CamposOferta
                desconto={form.desconto}
                quantidade={form.quantidade}
                prazoHoras={form.prazoHoras}
                prazoMinutos={form.prazoMinutos}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />
              {Number(form.preco_regular) > 0 ? (
                <PreviaPreco
                  regular={Number(form.preco_regular)}
                  desconto={descontoNumero(form.desconto) ?? 0}
                />
              ) : (
                <p className="mt-2 text-sm text-ink-mute">
                  Informe o preço regular para ver o valor da oferta.
                </p>
              )}
            </fieldset>
          )}

          {editando && anuncioEditando && (
            <fieldset className="rounded-xl border border-canvas-line bg-canvas p-3.5">
              <legend className="px-1.5 text-sm font-bold text-ink">Oferta ativa</legend>
              <CamposOferta
                desconto={form.desconto}
                quantidade={form.quantidade}
                prazoHoras={form.prazoHoras}
                prazoMinutos={form.prazoMinutos}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />
              {Number(form.preco_regular) > 0 ? (
                <PreviaPreco
                  regular={Number(form.preco_regular)}
                  desconto={descontoNumero(form.desconto) ?? 0}
                />
              ) : (
                <p className="mt-2 text-sm text-ink-mute">
                  Informe o preço regular para ver o valor da oferta.
                </p>
              )}
            </fieldset>
          )}

          {erro && (
            <div
              role="alert"
              className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
            >
              {erro}
            </div>
          )}
        </form>
      </Sheet>

      {/* Popup: anunciar produto existente */}
      <Sheet
        aberto={modal?.tipo === 'anunciar'}
        onFechar={fechar}
        titulo={modal?.tipo === 'anunciar' ? `Anunciar ${modal.produto.nome}` : 'Anunciar'}
        rodape={
          <div className="flex gap-2">
            <button type="button" onClick={fechar} className="btn btn-outline flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              form="form-anuncio"
              disabled={anunciar.isPending}
              className="btn btn-primary flex-1"
            >
              Publicar oferta
            </button>
          </div>
        }
      >
        <form id="form-anuncio" onSubmit={submitAnuncio} className="grid gap-2">
          <CamposOferta
            desconto={anuncioForm.desconto}
            quantidade={anuncioForm.quantidade}
            prazoHoras={anuncioForm.prazoHoras}
            prazoMinutos={anuncioForm.prazoMinutos}
            onChange={(patch) => setAnuncioForm({ ...anuncioForm, ...patch })}
          />
          {modal?.tipo === 'anunciar' && (
            <PreviaPreco
              regular={modal.produto.preco_regular}
              desconto={descontoNumero(anuncioForm.desconto) ?? 0}
            />
          )}
          {erro && (
            <div
              role="alert"
              className="mt-1 rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
            >
              {erro}
            </div>
          )}
        </form>
      </Sheet>

      {/* Popup: confirmar exclusão */}
      <Sheet
        aberto={modal?.tipo === 'excluir'}
        onFechar={fechar}
        titulo="Excluir produto"
        rodape={
          <div className="flex gap-2">
            <button type="button" onClick={fechar} className="btn btn-outline flex-1">
              Cancelar
            </button>
            <button
              type="button"
              disabled={desativar.isPending}
              onClick={() => modal?.tipo === 'excluir' && desativar.mutate(modal.produto.id)}
              className="btn btn-danger flex-1"
            >
              Excluir
            </button>
          </div>
        }
      >
        {modal?.tipo === 'excluir' && (
          <p className="text-ink-soft">
            Tem certeza que quer excluir <span className="font-bold text-ink">{modal.produto.nome}</span>?
            Isso também encerra o anúncio ativo, se houver.
          </p>
        )}
        {erro && (
          <div
            role="alert"
            className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
          >
            {erro}
          </div>
        )}
      </Sheet>
    </section>
  );
}

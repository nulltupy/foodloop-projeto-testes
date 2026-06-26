import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { CreateProdutoRequest, Produto } from '@foodloop/lib';

const CATEGORIAS = ['Lanche', 'Bebida', 'Sobremesa', 'Padaria', 'Refeição', 'Outros'];
const DESCONTOS = [10, 20, 30, 40, 50, 60, 70];
const PRAZOS = [
  { horas: 4, rotulo: 'Em 4 horas' },
  { horas: 8, rotulo: 'Em 8 horas' },
  { horas: 24, rotulo: 'Amanhã (24h)' },
  { horas: 48, rotulo: 'Em 2 dias' },
];

interface Formulario {
  nome: string;
  descricao: string;
  preco_regular: string;
  categoria: string;
  imagem: string;
  desconto: number;
  quantidade: string;
  prazoHoras: number;
}

const FORM_VAZIO: Formulario = {
  nome: '',
  descricao: '',
  preco_regular: '',
  categoria: 'Lanche',
  imagem: '',
  desconto: 50,
  quantidade: '5',
  prazoHoras: 24,
};

// Formulário enxuto para anunciar um produto já cadastrado.
const ANUNCIO_VAZIO = { desconto: 50, quantidade: '5', prazoHoras: 24 };

function paraRequest(f: Formulario): CreateProdutoRequest {
  return {
    nome: f.nome.trim(),
    descricao: f.descricao.trim() || undefined,
    preco_regular: Number(f.preco_regular),
    categoria: f.categoria,
    imagem: f.imagem.trim() || undefined,
  };
}

function deProduto(p: Produto): Formulario {
  return {
    ...FORM_VAZIO,
    nome: p.nome,
    descricao: p.descricao ?? '',
    preco_regular: String(p.preco_regular),
    categoria: p.categoria,
    imagem: p.imagem ?? '',
  };
}

function precoComDesconto(precoRegular: string, desconto: number): number | null {
  const preco = Number(precoRegular);
  if (!Number.isFinite(preco) || preco <= 0) return null;
  return Number((preco * (1 - desconto / 100)).toFixed(2));
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

export function PainelProdutos() {
  const qc = useQueryClient();
  const lista = useQuery({ queryKey: ['produtos-meus'], queryFn: () => api.produtos.listarMeus() });
  const anuncios = useQuery({
    queryKey: ['anuncios-meus'],
    queryFn: () => api.anuncios.listarMeus(),
  });

  function anuncioAtivoDe(produtoId: number) {
    return anuncios.data?.find((a) => a.id_produto === produtoId && a.status === 'ATIVO');
  }

  const [emEdicao, setEmEdicao] = useState<Produto | null>(null);
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [anunciando, setAnunciando] = useState<Produto | null>(null);
  const [anuncioForm, setAnuncioForm] = useState(ANUNCIO_VAZIO);
  const [erroAnuncio, setErroAnuncio] = useState<string | null>(null);

  function invalidar() {
    void qc.invalidateQueries({ queryKey: ['produtos-meus'] });
    void qc.invalidateQueries({ queryKey: ['anuncios'] });
    void qc.invalidateQueries({ queryKey: ['anuncios-meus'] });
  }

  const criar = useMutation({
    mutationFn: async (f: Formulario) => {
      const produto = await api.produtos.criar(paraRequest(f));
      const prazo = new Date(Date.now() + f.prazoHoras * 60 * 60 * 1000).toISOString();
      await api.anuncios.criar({
        id_produto: produto.id,
        preco_promocional: precoComDesconto(f.preco_regular, f.desconto)!,
        quantidade_inicial: Number(f.quantidade),
        prazo_retirada: prazo,
      });
      return produto;
    },
    onSuccess: () => {
      setForm(FORM_VAZIO);
      setErro(null);
      invalidar();
    },
    onError: (e: unknown) => {
      setErro(e instanceof Error ? e.message : 'Erro ao criar produto');
    },
  });

  const atualizar = useMutation({
    mutationFn: (args: { id: number; data: CreateProdutoRequest }) =>
      api.produtos.atualizar(args.id, args.data),
    onSuccess: () => {
      setEmEdicao(null);
      setForm(FORM_VAZIO);
      setErro(null);
      invalidar();
    },
    onError: (e: unknown) => {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar produto');
    },
  });

  const desativar = useMutation({
    mutationFn: (id: number) => api.produtos.desativar(id),
    onSuccess: () => {
      setExcluindo(null);
      invalidar();
    },
    onError: () => {
      setExcluindo(null);
      setErro('Erro ao excluir produto');
    },
  });

  // Publica uma oferta para um produto que já existe e está sem anúncio ativo.
  const anunciar = useMutation({
    mutationFn: (args: { produto: Produto; desconto: number; quantidade: string; prazoHoras: number }) => {
      const prazo = new Date(Date.now() + args.prazoHoras * 60 * 60 * 1000).toISOString();
      return api.anuncios.criar({
        id_produto: args.produto.id,
        preco_promocional: precoComDesconto(String(args.produto.preco_regular), args.desconto)!,
        quantidade_inicial: Number(args.quantidade),
        prazo_retirada: prazo,
      });
    },
    onSuccess: () => {
      setAnunciando(null);
      setAnuncioForm(ANUNCIO_VAZIO);
      setErroAnuncio(null);
      invalidar();
    },
    onError: (e: unknown) => {
      setErroAnuncio(e instanceof Error ? e.message : 'Erro ao publicar anúncio');
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.preco_regular) {
      setErro('Nome e preço são obrigatórios');
      return;
    }
    const quantidade = Number(form.quantidade);
    if (!emEdicao && (!Number.isInteger(quantidade) || quantidade < 1)) {
      setErro('Quantidade precisa ser um número inteiro maior que zero');
      return;
    }
    if (emEdicao) {
      atualizar.mutate({ id: emEdicao.id, data: paraRequest(form) });
    } else {
      criar.mutate(form);
    }
  }

  function iniciarEdicao(p: Produto) {
    setEmEdicao(p);
    setForm(deProduto(p));
    setErro(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEmEdicao(null);
    setForm(FORM_VAZIO);
    setErro(null);
  }

  const precoFinal = precoComDesconto(form.preco_regular, form.desconto);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Meus anúncios</h1>
      <p className="mt-1 text-sm text-ink-500">
        Cadastre um produto e publique a oferta: você escolhe o desconto, a quantidade e o prazo de retirada.
        A oferta aparece na home dos clientes próximos.
      </p>

      <section className="mt-6 rounded-lg border border-surface-200 bg-white p-4">
        <h2 className="text-lg font-medium text-ink-900">
          {emEdicao ? `Editar: ${emEdicao.nome}` : 'Novo produto + oferta'}
        </h2>

        <form onSubmit={onSubmit} className="mt-3 grid gap-3">
          <label className="text-sm">
            Nome
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
              placeholder="Ex: Coxinha de Frango"
              required
              maxLength={120}
            />
          </label>

          <label className="text-sm">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
              placeholder="Detalhe o item (opcional)"
              rows={2}
              maxLength={500}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Preço regular (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.preco_regular}
                onChange={(e) => setForm({ ...form, preco_regular: e.target.value })}
                className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                placeholder="0.00"
                required
              />
            </label>

            <label className="text-sm">
              Categoria
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm">
            URL da imagem (opcional)
            <input
              type="url"
              value={form.imagem}
              onChange={(e) => setForm({ ...form, imagem: e.target.value })}
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
              placeholder="https://..."
            />
          </label>

          {!emEdicao && (
            <fieldset className="rounded-md border border-surface-200 bg-surface-50 p-3">
              <legend className="px-1 text-sm font-medium text-ink-900">Oferta</legend>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm">
                  Desconto
                  <select
                    value={form.desconto}
                    onChange={(e) => setForm({ ...form, desconto: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                  >
                    {DESCONTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}%
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  Quantidade
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                    required
                  />
                </label>

                <label className="text-sm">
                  Retirada até
                  <select
                    value={form.prazoHoras}
                    onChange={(e) => setForm({ ...form, prazoHoras: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                  >
                    {PRAZOS.map((p) => (
                      <option key={p.horas} value={p.horas}>
                        {p.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="mt-2 text-sm text-ink-700">
                {precoFinal !== null ? (
                  <>
                    Cliente paga <span className="font-semibold text-brand-700">{moeda(precoFinal)}</span>{' '}
                    <span className="text-ink-500 line-through">{moeda(Number(form.preco_regular))}</span>
                  </>
                ) : (
                  'Informe o preço regular para ver o valor da oferta.'
                )}
              </p>
            </fieldset>
          )}

          {erro && (
            <div role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {erro}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={criar.isPending || atualizar.isPending}
              className="min-h-11 flex-1 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
            >
              {emEdicao ? 'Salvar alterações' : 'Publicar oferta'}
            </button>
            {emEdicao && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="min-h-11 rounded-lg border border-surface-300 px-4 font-medium text-ink-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium text-ink-900">Produtos cadastrados</h2>
        {lista.isLoading && <p className="mt-2 text-sm text-ink-500">Carregando…</p>}
        {lista.isError && (
          <div className="mt-2 rounded-md bg-danger-50 p-3 text-sm text-danger-700">
            Não foi possível carregar seus produtos. Confirme que você está logado como comerciante.
          </div>
        )}
        {lista.data && lista.data.length === 0 && (
          <p className="mt-2 text-sm text-ink-500">Nenhum produto cadastrado ainda.</p>
        )}
        <ul className="mt-3 grid gap-3">
          {lista.data?.map((p) => {
            const anuncio = anuncioAtivoDe(p.id);
            return (
              <li key={p.id} className="rounded-lg border border-surface-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{p.nome}</p>
                    <p className="truncate text-sm text-ink-500">
                      {moeda(p.preco_regular)} · {p.categoria}
                      {!p.ativo && ' · inativo'}
                    </p>
                    {anuncio ? (
                      <p className="truncate text-sm font-medium text-brand-700">
                        Anunciado: {moeda(anuncio.preco_promocional)} · {anuncio.quantidade_disponivel}{' '}
                        disponíveis · retirada até {formatarPrazo(anuncio.prazo_retirada)}
                      </p>
                    ) : (
                      p.ativo && <p className="truncate text-sm text-ink-500">Sem anúncio ativo</p>
                    )}
                  </div>

                  {excluindo === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-danger-700">
                        Excluir &ldquo;{p.nome}&rdquo;?
                      </span>
                      <button
                        type="button"
                        onClick={() => desativar.mutate(p.id)}
                        disabled={desativar.isPending}
                        className="min-h-11 rounded-lg bg-danger-500 px-3 text-sm font-medium text-white disabled:opacity-60"
                      >
                        Sim, excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcluindo(null)}
                        className="min-h-11 rounded-lg border border-surface-300 px-3 text-sm font-medium text-ink-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {p.ativo && !anuncio && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnunciando(anunciando?.id === p.id ? null : p);
                            setAnuncioForm(ANUNCIO_VAZIO);
                            setErroAnuncio(null);
                          }}
                          className="min-h-11 rounded-lg bg-brand-700 px-3 text-sm font-medium text-white"
                        >
                          Anunciar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(p)}
                        className="min-h-11 rounded-lg border border-surface-300 px-3 text-sm font-medium text-ink-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcluindo(p.id)}
                        className="min-h-11 rounded-lg border border-danger-500 px-3 text-sm font-medium text-danger-700"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

                {anunciando?.id === p.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const quantidade = Number(anuncioForm.quantidade);
                      if (!Number.isInteger(quantidade) || quantidade < 1) {
                        setErroAnuncio('Quantidade precisa ser um número inteiro maior que zero');
                        return;
                      }
                      setErroAnuncio(null);
                      anunciar.mutate({ produto: p, ...anuncioForm });
                    }}
                    className="mt-3 rounded-md border border-surface-200 bg-surface-50 p-3"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <label className="text-sm">
                        Desconto
                        <select
                          value={anuncioForm.desconto}
                          onChange={(e) =>
                            setAnuncioForm({ ...anuncioForm, desconto: Number(e.target.value) })
                          }
                          className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                        >
                          {DESCONTOS.map((d) => (
                            <option key={d} value={d}>
                              {d}%
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm">
                        Quantidade
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={anuncioForm.quantidade}
                          onChange={(e) => setAnuncioForm({ ...anuncioForm, quantidade: e.target.value })}
                          className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                          required
                        />
                      </label>

                      <label className="text-sm">
                        Retirada até
                        <select
                          value={anuncioForm.prazoHoras}
                          onChange={(e) =>
                            setAnuncioForm({ ...anuncioForm, prazoHoras: Number(e.target.value) })
                          }
                          className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base"
                        >
                          {PRAZOS.map((pr) => (
                            <option key={pr.horas} value={pr.horas}>
                              {pr.rotulo}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <p className="mt-2 text-sm text-ink-700">
                      Cliente paga{' '}
                      <span className="font-semibold text-brand-700">
                        {moeda(precoComDesconto(String(p.preco_regular), anuncioForm.desconto)!)}
                      </span>{' '}
                      <span className="text-ink-500 line-through">{moeda(p.preco_regular)}</span>
                    </p>

                    {erroAnuncio && (
                      <div
                        role="alert"
                        className="mt-2 rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600"
                      >
                        {erroAnuncio}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={anunciar.isPending}
                        className="min-h-11 flex-1 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
                      >
                        Publicar oferta
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnunciando(null);
                          setErroAnuncio(null);
                        }}
                        className="min-h-11 rounded-lg border border-surface-300 px-4 font-medium text-ink-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

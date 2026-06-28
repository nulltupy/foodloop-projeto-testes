import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { useCarrinho } from '../store';

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function codigoErro(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error?.code;
}

export function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const anuncioId = Number(params.get('anuncio'));
  const { itens, adicionar, limpar, total } = useCarrinho();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const anuncioQ = useQuery({
    queryKey: ['anuncio', anuncioId],
    queryFn: () => api.anuncios.getById(anuncioId),
    enabled: Number.isInteger(anuncioId) && anuncioId > 0,
  });
  const produtosQ = useQuery({
    queryKey: ['produtos-estab', anuncioQ.data?.id_estabelecimento],
    queryFn: () => api.produtos.listarPorEstabelecimento(anuncioQ.data!.id_estabelecimento),
    enabled: !!anuncioQ.data,
  });

  // Adiciona o anúncio do parâmetro ao carrinho assim que os dados chegam.
  useEffect(() => {
    const a = anuncioQ.data;
    const nome = produtosQ.data?.find((p) => p.id === a?.id_produto)?.nome;
    if (a && nome) {
      adicionar({ id_anuncio: a.id, quantidade: 1, preco: a.preco_promocional, produto_nome: nome });
    }
  }, [anuncioQ.data, produtosQ.data, adicionar]);

  async function finalizar() {
    const item = itens[0];
    if (!item) return;
    setErro(null);
    setEnviando(true);
    try {
      const pedido = await api.pedidos.criar({
        itens: [{ id_anuncio: item.id_anuncio, quantidade: item.quantidade }],
      });
      limpar();
      navigate(`/pedidos/${pedido.id}`);
    } catch (e) {
      setErro(
        codigoErro(e) === 'ANUNCIO_ESGOTADO'
          ? 'Um dos itens não está mais disponível.'
          : 'Não foi possível concluir a reserva. Tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  if (itens.length === 0) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="text-ink-soft">Seu carrinho está vazio.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-leaf-dark hover:underline">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold text-ink">Quase lá</h1>
      <p className="mt-1 text-ink-soft">Confira e reserve — o pagamento é no balcão.</p>

      <div className="card mt-5 p-4 sm:p-5">
        <ul className="flex flex-col gap-3">
          {itens.map((item) => (
            <li key={item.id_anuncio} className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-ink">
                {item.quantidade}× {item.produto_nome}
              </span>
              <span className="nums font-bold text-ink">{moeda(item.preco * item.quantidade)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-canvas-line pt-3">
          <span className="text-lg font-bold text-ink">Total</span>
          <span className="nums text-2xl font-extrabold text-leaf-dark">{moeda(total())}</span>
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
        >
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={finalizar}
        disabled={enviando}
        className="btn btn-primary mt-5 w-full text-base"
      >
        {enviando ? 'Reservando…' : 'Reservar pedido'}
      </button>
    </main>
  );
}

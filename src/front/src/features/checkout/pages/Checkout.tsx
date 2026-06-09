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
      <main className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-ink-700">Seu carrinho está vazio.</p>
        <Link to="/" className="mt-3 inline-block font-medium text-brand-700">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Checkout</h1>

      <ul className="mt-4 flex flex-col gap-2">
        {itens.map((item) => (
          <li
            key={item.id_anuncio}
            className="flex justify-between rounded-lg border border-surface-200 bg-white p-3"
          >
            <span className="text-ink-900">
              {item.quantidade}× {item.produto_nome}
            </span>
            <span className="font-medium text-ink-900">{moeda(item.preco * item.quantidade)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between text-lg font-semibold text-ink-900">
        <span>Total</span>
        <span>{moeda(total())}</span>
      </div>

      <p className="mt-4 rounded-lg bg-surface-100 p-3 text-sm text-ink-700">
        No momento, o pagamento é presencial: você recebe um código de retirada e paga no balcão ao buscar o
        pedido.
      </p>

      {erro && (
        <p role="alert" className="mt-3 text-sm text-danger-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={finalizar}
        disabled={enviando}
        className="mt-4 min-h-11 w-full rounded-lg bg-brand-500 px-4 font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Reservando...' : 'Reservar e pagar presencialmente'}
      </button>
    </main>
  );
}

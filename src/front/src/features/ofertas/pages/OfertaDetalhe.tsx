import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { NotaEstrelas } from '../../../components/ui/NotaEstrelas';

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Contagem regressiva até o prazo de retirada, atualizada a cada segundo.
function tempoRestante(prazoIso: string, agora: number): string {
  const restante = new Date(prazoIso).getTime() - agora;
  if (restante <= 0) return 'Prazo encerrado';
  const h = Math.floor(restante / 3_600_000);
  const m = Math.floor((restante % 3_600_000) / 60_000);
  const s = Math.floor((restante % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function OfertaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const anuncioId = Number(id);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const anuncioQ = useQuery({
    queryKey: ['anuncio', anuncioId],
    queryFn: () => api.anuncios.getById(anuncioId),
  });
  const anuncio = anuncioQ.data;

  const estabQ = useQuery({
    queryKey: ['estabelecimento', anuncio?.id_estabelecimento],
    queryFn: () => api.estabelecimentos.getById(anuncio!.id_estabelecimento),
    enabled: !!anuncio,
  });
  const estab = estabQ.data;

  const produtosQ = useQuery({
    queryKey: ['produtos-estab', anuncio?.id_estabelecimento],
    queryFn: () => api.produtos.listarPorEstabelecimento(anuncio!.id_estabelecimento),
    enabled: !!anuncio,
  });
  const produto = produtosQ.data?.find((p) => p.id === anuncio?.id_produto);

  if (anuncioQ.isLoading) {
    return <div className="mx-auto m-4 h-64 max-w-2xl animate-pulse rounded-lg bg-surface-100" />;
  }

  if (anuncioQ.isError || !anuncio) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-ink-700">Não foi possível carregar esta oferta.</p>
        <Link to="/" className="mt-3 inline-block font-medium text-brand-700">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  const indisponivel = anuncio.quantidade_disponivel === 0 || anuncio.status !== 'ATIVO';
  const coords = estab?.endereco;

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      {produto?.imagem && (
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}

      <h1 className="mt-4 text-2xl font-semibold text-ink-900">{produto?.nome ?? 'Oferta'}</h1>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-ink-700">{estab?.nome_fantasia}</span>
        <NotaEstrelas nota={estab?.nota_media} />
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-brand-700">{moeda(anuncio.preco_promocional)}</span>
        {produto && <span className="text-ink-500 line-through">{moeda(produto.preco_regular)}</span>}
      </div>

      <p className="mt-2 text-sm text-ink-700">
        {anuncio.quantidade_disponivel} disponível(is) · retirada em{' '}
        <span className="font-mono">{tempoRestante(anuncio.prazo_retirada, agora)}</span>
      </p>

      {produto?.descricao && <p className="mt-3 text-ink-700">{produto.descricao}</p>}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={indisponivel}
          onClick={() => navigate(`/checkout?anuncio=${anuncio.id}`)}
          className="min-h-11 rounded-lg bg-brand-500 px-4 font-medium text-white disabled:opacity-60"
        >
          {indisponivel ? 'Indisponível' : 'Reservar'}
        </button>

        {coords && (
          <a
            href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="min-h-11 rounded-lg border border-surface-200 px-4 py-2 text-center font-medium text-brand-700"
          >
            Como chegar
          </a>
        )}
      </div>
    </main>
  );
}

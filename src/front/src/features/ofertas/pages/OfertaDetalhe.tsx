import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import { NotaEstrelas } from '../../../components/ui/NotaEstrelas';
import { LogoSmall } from '../../../components/ui/Logo';

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
    return <div className="mx-auto m-4 h-72 max-w-2xl animate-pulse rounded-3xl bg-canvas-line/60" />;
  }

  if (anuncioQ.isError || !anuncio) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-ink-soft">Não foi possível carregar esta oferta.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-leaf-dark hover:underline">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  const indisponivel = anuncio.quantidade_disponivel === 0 || anuncio.status !== 'ATIVO';
  const coords = estab?.endereco;
  const regular = produto?.preco_regular ?? anuncio.preco_promocional;
  const off = Math.max(0, Math.round((1 - anuncio.preco_promocional / regular) * 100));
  const economia = Math.max(0, regular - anuncio.preco_promocional);
  const prazo = tempoRestante(anuncio.prazo_retirada, agora);
  const encerrando =
    prazo !== 'Prazo encerrado' && new Date(anuncio.prazo_retirada).getTime() - agora < 2 * 3_600_000;

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-leaf-dark"
      >
        ← Voltar às ofertas
      </Link>

      <article className="card animate-rise overflow-hidden">
        <div className="relative aspect-[4/3] bg-leaf-50 sm:aspect-[16/9]">
          {produto?.imagem ? (
            <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <LogoSmall className="h-[125px] w-[125px]" />
            </div>
          )}
          {off > 0 && (
            <span className="selo absolute right-4 top-4 h-16 w-16 text-lg leading-none">−{off}%</span>
          )}
          <span
            className={`absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold backdrop-blur-sm ${
              encerrando ? 'bg-citrus text-ink' : 'bg-ink/80 text-white'
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            Retira em <span className="nums tabular-nums">{prazo}</span>
          </span>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {estab ? (
              <Link
                to={`/estabelecimentos/${estab.id}`}
                className="font-semibold text-ink-soft transition-colors hover:text-leaf-dark hover:underline"
              >
                {estab.nome_fantasia}
              </Link>
            ) : (
              <span className="font-semibold text-ink-soft">Estabelecimento</span>
            )}
            <NotaEstrelas nota={estab?.nota_media} />
          </div>

          <h1 className="mt-1.5 text-2xl font-extrabold text-ink sm:text-3xl">{produto?.nome ?? 'Oferta'}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="nums text-4xl font-extrabold text-leaf-dark">
              {moeda(anuncio.preco_promocional)}
            </span>
            {produto && <span className="nums text-ink-mute line-through">{moeda(regular)}</span>}
            {economia > 0 && (
              <span className="rounded-full bg-citrus-50 px-3 py-1 text-sm font-bold text-citrus-dark">
                economize {moeda(economia)}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="pill">
              {anuncio.quantidade_disponivel} disponíve{anuncio.quantidade_disponivel > 1 ? 'is' : 'l'}
            </span>
            {estab && <span className="pill bg-canvas text-ink-soft">📍 {estab.nome_fantasia}</span>}
          </div>

          {produto?.descricao && <p className="mt-4 text-ink-soft">{produto.descricao}</p>}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={indisponivel}
              onClick={() => navigate(`/checkout?anuncio=${anuncio.id}`)}
              className="btn btn-primary w-full text-base"
            >
              {indisponivel ? 'Esgotado por enquanto' : 'Reservar agora'}
            </button>

            {coords && (
              <a
                href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline w-full"
              >
                Como chegar
              </a>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { Endereco } from '@foodloop/lib';
import { LogoSmall } from '../../../components/ui/Logo';
import { NotaEstrelas } from '../../../components/ui/NotaEstrelas';
import { AvaliacoesEstabelecimento } from '../../avaliacoes/components/AvaliacoesEstabelecimento';

function enderecoTexto(endereco: Endereco): string {
  return `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}, ${endereco.cep}`;
}

function mapsUrl(endereco: Endereco): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoTexto(endereco))}`;
}

function osmEmbedUrl(endereco: Endereco): string {
  const delta = 0.004;
  const lat = endereco.latitude;
  const lng = endereco.longitude;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].map((n) => n.toFixed(6)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function IconeSeta() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M19 12H5" strokeLinecap="round" />
      <path d="m12 19-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconePino() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconeSacola() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

export function PerfilEstabelecimento() {
  const { id } = useParams();
  const estabelecimentoId = Number(id);

  const estabelecimentoQ = useQuery({
    queryKey: ['estabelecimento', estabelecimentoId],
    queryFn: () => api.estabelecimentos.getById(estabelecimentoId),
    enabled: Number.isInteger(estabelecimentoId) && estabelecimentoId > 0,
  });

  if (!Number.isInteger(estabelecimentoId) || estabelecimentoId <= 0) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 text-center sm:p-6">
        <p className="text-ink-soft">Estabelecimento inválido.</p>
        <Link to="/" className="mt-3 inline-flex font-bold text-leaf-dark hover:underline">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  if (estabelecimentoQ.isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6" aria-hidden>
        <div className="h-8 w-28 animate-pulse rounded bg-canvas-line" />
        <div className="mt-8 flex gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-canvas-line" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-3/4 animate-pulse rounded bg-canvas-line" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-canvas-line" />
            <div className="h-11 w-36 animate-pulse rounded-lg bg-canvas-line" />
          </div>
        </div>
      </main>
    );
  }

  if (estabelecimentoQ.isError || !estabelecimentoQ.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 text-center sm:p-6">
        <p className="text-ink-soft">Não foi possível carregar este estabelecimento.</p>
        <Link to="/" className="mt-3 inline-flex font-bold text-leaf-dark hover:underline">
          Voltar às ofertas
        </Link>
      </main>
    );
  }

  const estabelecimento = estabelecimentoQ.data;
  const endereco = estabelecimento.endereco;
  const enderecoCompleto = enderecoTexto(endereco);

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-leaf-dark"
      >
        <IconeSeta />
        Voltar
      </Link>

      <header className="flex flex-col gap-5 border-b border-canvas-line pb-6 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-canvas-line bg-leaf-50">
          <LogoSmall className="h-[109px] w-[109px] opacity-85" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-[2.4rem]">
              {estabelecimento.nome_fantasia}
            </h1>
            {!estabelecimento.ativo && (
              <span className="rounded-full bg-danger-50 px-3 py-1 text-xs font-extrabold text-danger">
                Fechado
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <NotaEstrelas nota={estabelecimento.nota_media} />
            <span className="inline-flex items-center gap-1.5">
              <IconePino /> {endereco.bairro}, {endereco.cidade}
            </span>
          </div>

          <Link
            to={`/?estabelecimento=${estabelecimento.id}`}
            className="btn btn-primary mt-5 w-full sm:w-auto"
          >
            <IconeSacola />
            Ver ofertas
          </Link>
        </div>
      </header>

      <section className="border-b border-canvas-line py-6">
        <h2 className="text-xl font-extrabold text-ink">Sobre</h2>
        <p className="mt-2 text-ink-soft">
          {estabelecimento.descricao || 'Este estabelecimento ainda não adicionou uma descrição.'}
        </p>
        {estabelecimento.horario_funcionamento && (
          <p className="mt-3 text-sm font-semibold text-ink-soft">{estabelecimento.horario_funcionamento}</p>
        )}
      </section>

      <section className="border-b border-canvas-line py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-ink">Endereço</h2>
            <p className="mt-2 text-ink-soft">{enderecoCompleto}</p>
          </div>
          <a href={mapsUrl(endereco)} target="_blank" rel="noreferrer" className="btn btn-outline shrink-0">
            Como chegar
          </a>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-canvas-line bg-canvas-card">
          <iframe
            title={`Mapa de ${estabelecimento.nome_fantasia}`}
            src={osmEmbedUrl(endereco)}
            className="h-64 w-full"
            loading="lazy"
          />
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-ink">Avaliações</h2>
          <NotaEstrelas nota={estabelecimento.nota_media} />
        </div>
        <AvaliacoesEstabelecimento estabelecimentoId={estabelecimento.id} />
      </section>
    </main>
  );
}

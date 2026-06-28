import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { AnuncioListItem, ListarAnunciosQuery } from '@foodloop/lib';
import { useGeoCoords } from '../hooks/useGeoCoords';
import { Marca } from '../../../components/ui/Marca';
import { NotaEstrelas } from '../../../components/ui/NotaEstrelas';
import { Sheet } from '../../../components/ui/Sheet';

// Centro de Betim/MG — fallback fixo enquanto não existe input de CEP +
// proxy de geocoding. Os dados do seed de demonstração estão todos em Betim.
const CENTRO_BETIM = { latitude: -19.954, longitude: -44.199 };
const RAIO_BUSCA_KM = 5000;
const CATEGORIAS = ['Padaria', 'Lanche', 'Refeição', 'Doce', 'Bebida', 'Hortifruti'];
type OrdemDistancia = 'asc' | 'desc';

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function horaRetirada(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function descontoPct(promo: number, regular: number): number {
  return Math.max(0, Math.round((1 - promo / regular) * 100));
}
function fechaLogo(iso: string): boolean {
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 && ms < 2 * 3_600_000;
}

async function listarPrimeirasPaginas(query: ListarAnunciosQuery): Promise<AnuncioListItem[]> {
  const paginas = await Promise.all([1, 2, 3].map((pagina) => api.anuncios.listar({ ...query, pagina })));
  const unicos = new Map<number, AnuncioListItem>();
  paginas.flat().forEach((oferta) => unicos.set(oferta.id, oferta));
  return [...unicos.values()];
}

function IconePino() {
  return (
    <svg
      width="13"
      height="13"
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
function IconeRelogio() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
function IconeFiltro() {
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
      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

function OfertaCard({ oferta, indice }: { oferta: AnuncioListItem; indice: number }) {
  const off = descontoPct(oferta.preco_promocional, oferta.preco_regular);
  const soon = fechaLogo(oferta.prazo_retirada);
  return (
    <Link
      to={`/oferta/${oferta.id}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 45}ms` }}
      className="group flex animate-rise flex-col overflow-hidden rounded-2xl border border-canvas-line bg-canvas-card shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="relative h-[150px] overflow-hidden bg-leaf-50">
        {oferta.produto_imagem ? (
          <img
            src={oferta.produto_imagem}
            alt={oferta.produto_nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Marca className="h-11 w-11 opacity-80" />
          </div>
        )}
        {off > 0 && (
          <span className="selo absolute right-3 top-3 h-[54px] w-[54px] text-base leading-none">
            −{off}%
          </span>
        )}
        {soon && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            ⚡ fecha logo
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink-mute">{oferta.nome_fantasia}</span>
          <NotaEstrelas nota={oferta.nota_media} />
        </div>
        <h3 className="mt-0.5 truncate text-lg font-extrabold text-ink">{oferta.produto_nome}</h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="nums text-2xl font-extrabold text-leaf-dark">
            {moeda(oferta.preco_promocional)}
          </span>
          <span className="nums text-sm text-ink-mute line-through">{moeda(oferta.preco_regular)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="pill">
            <IconePino /> {oferta.distancia_km.toFixed(1)} km
          </span>
          <span className={`pill ${soon ? 'bg-citrus-50 text-citrus-dark' : ''}`}>
            <IconeRelogio /> até {horaRetirada(oferta.prazo_retirada)}
          </span>
        </div>
      </div>
    </Link>
  );
}

interface Filtros {
  ordemDistancia: OrdemDistancia;
  precoMax: string;
  categoria: string;
  estab: number | '';
}

const FILTROS_PADRAO: Filtros = { ordemDistancia: 'asc', precoMax: '', categoria: '', estab: '' };

function FiltroSheet({
  aberto,
  onFechar,
  filtros,
  estabs,
  onAplicar,
}: {
  aberto: boolean;
  onFechar: () => void;
  filtros: Filtros;
  estabs: { id: number; nome: string }[];
  onAplicar: (f: Filtros) => void;
}) {
  const [draft, setDraft] = useState<Filtros>(filtros);

  // Sincroniza o rascunho sempre que o painel abre.
  useEffect(() => {
    if (aberto) setDraft(filtros);
  }, [aberto, filtros]);

  const seletor =
    'mt-1.5 w-full appearance-none rounded-lg border border-canvas-line bg-white px-3.5 py-2.5 text-base text-ink focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/25';

  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Filtrar"
      rodape={
        <div className="flex gap-2.5">
          <button type="button" onClick={() => onAplicar(FILTROS_PADRAO)} className="btn btn-outline">
            Limpar
          </button>
          <button type="button" onClick={() => onAplicar(draft)} className="btn btn-primary flex-1">
            Ver ofertas
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="lbl">Estabelecimento</span>
          <select
            className={seletor}
            value={draft.estab}
            onChange={(e) => setDraft((d) => ({ ...d, estab: e.target.value ? Number(e.target.value) : '' }))}
          >
            <option value="">Todos os estabelecimentos</option>
            {estabs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="lbl">Distância</span>
          <select
            className={seletor}
            value={draft.ordemDistancia}
            onChange={(e) => setDraft((d) => ({ ...d, ordemDistancia: e.target.value as OrdemDistancia }))}
          >
            <option value="asc">Distância ascendente</option>
            <option value="desc">Distância descendente</option>
          </select>
        </label>

        <label className="block">
          <span className="lbl">Preço máximo</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={seletor}
            value={draft.precoMax}
            onChange={(e) => setDraft((d) => ({ ...d, precoMax: e.target.value }))}
            placeholder="Sem limite"
          />
        </label>

        <label className="block">
          <span className="lbl">Categoria</span>
          <select
            className={seletor}
            value={draft.categoria}
            onChange={(e) => setDraft((d) => ({ ...d, categoria: e.target.value }))}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Sheet>
  );
}

export function Home() {
  const { coords, erro, definirManual } = useGeoCoords();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [sheetAberto, setSheetAberto] = useState(false);
  const precoMax = Number(filtros.precoMax.replace(',', '.'));
  const origem = coords ?? CENTRO_BETIM;

  const query: ListarAnunciosQuery = {
    lat: origem.latitude,
    lng: origem.longitude,
    raio_km: RAIO_BUSCA_KM,
    pagina: 1,
    ...(filtros.precoMax.trim() && Number.isFinite(precoMax) && precoMax > 0 ? { preco_max: precoMax } : {}),
    ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['anuncios', query],
    queryFn: () => listarPrimeirasPaginas(query),
  });

  // Estabelecimentos presentes no raio/categoria atuais (para o filtro).
  const estabs = useMemo(() => {
    const mapa = new Map<number, string>();
    data?.forEach((a) => mapa.set(a.id_estabelecimento, a.nome_fantasia));
    return [...mapa].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data]);

  // Estabelecimento e ordem desc são client-side; a API ordena por distância asc.
  const ofertas = useMemo(() => {
    const filtradas = filtros.estab
      ? (data ?? []).filter((a) => a.id_estabelecimento === filtros.estab)
      : (data ?? []);
    return [...filtradas].sort((a, b) =>
      filtros.ordemDistancia === 'asc' ? a.distancia_km - b.distancia_km : b.distancia_km - a.distancia_km,
    );
  }, [data, filtros.estab, filtros.ordemDistancia]);

  const ativos =
    (filtros.ordemDistancia !== FILTROS_PADRAO.ordemDistancia ? 1 : 0) +
    (filtros.precoMax.trim() ? 1 : 0) +
    (filtros.categoria ? 1 : 0) +
    (filtros.estab ? 1 : 0);

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <section className="mb-5">
        <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-[2.4rem]">
          Comida boa, <span className="text-leaf-dark">preço de resgate</span>.
        </h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Ofertas perto de você, antes que vá pro lixo — você salva comida e paga bem menos.
        </p>
      </section>

      {erro && !coords && (
        <div className="card mb-5 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-soft">Não pegamos sua localização. Ver as ofertas no centro de Betim/MG?</p>
          <button
            type="button"
            onClick={() => definirManual(CENTRO_BETIM)}
            className="btn btn-primary shrink-0"
          >
            Usar centro de Betim
          </button>
        </div>
      )}

      {/* Barra de filtro: um botão Filtrar + contagem de resultados. */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSheetAberto(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-canvas-line bg-canvas-card px-4 text-sm font-bold text-ink shadow-soft transition-colors hover:border-leaf-200"
        >
          <IconeFiltro />
          Filtrar
          {ativos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf px-1 text-xs font-extrabold text-white">
              {ativos}
            </span>
          )}
        </button>
        {!isLoading && data && (
          <span className="text-sm font-semibold text-ink-mute">
            {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-canvas-line bg-canvas-card">
              <div className="h-[150px] animate-pulse bg-canvas" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-canvas" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-canvas" />
                <div className="h-6 w-1/3 animate-pulse rounded bg-canvas" />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && ofertas.length > 0 && (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {ofertas.map((oferta, i) => (
            <li key={oferta.id}>
              <OfertaCard oferta={oferta} indice={i} />
            </li>
          ))}
        </ul>
      )}

      {data && ofertas.length === 0 && (
        <div className="card mx-auto mt-8 max-w-sm p-8 text-center">
          <Marca className="mx-auto h-12 w-12" />
          <p className="mt-4 text-lg font-extrabold text-ink">Nenhuma oferta por aqui</p>
          <p className="mt-1 text-ink-soft">Tente limpar os filtros.</p>
          <button type="button" onClick={() => setFiltros(FILTROS_PADRAO)} className="btn btn-soft mt-5">
            Limpar filtros
          </button>
        </div>
      )}

      <FiltroSheet
        aberto={sheetAberto}
        onFechar={() => setSheetAberto(false)}
        filtros={filtros}
        estabs={estabs}
        onAplicar={(f) => {
          setFiltros(f);
          setSheetAberto(false);
        }}
      />
    </main>
  );
}

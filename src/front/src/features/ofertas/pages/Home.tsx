import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { AnuncioListItem, ListarAnunciosQuery } from '@foodloop/lib';
import { useGeoCoords } from '../hooks/useGeoCoords';

const CENTRO_SP = { latitude: -23.55, longitude: -46.63 };
const RAIOS = [1, 3, 5, 10];
const CATEGORIAS = ['Padaria', 'Lanche', 'Refeição', 'Doce', 'Bebida', 'Hortifruti'];

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function horaRetirada(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function OfertaCard({ oferta }: { oferta: AnuncioListItem }) {
  return (
    <Link
      to={`/oferta/${oferta.id}`}
      className="flex flex-col gap-1 rounded-lg border border-surface-200 bg-white p-4"
    >
      <span className="font-medium text-ink-900">{oferta.produto_nome}</span>
      <span className="text-sm text-ink-500">{oferta.nome_fantasia}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-brand-700">{moeda(oferta.preco_promocional)}</span>
        <span className="text-sm text-ink-500 line-through">{moeda(oferta.preco_regular)}</span>
      </div>
      <div className="flex justify-between text-sm text-ink-500">
        <span>{oferta.distancia_km.toFixed(1)} km</span>
        <span>Retira até {horaRetirada(oferta.prazo_retirada)}</span>
      </div>
    </Link>
  );
}

export function Home() {
  const { coords, erro, definirManual } = useGeoCoords();
  const [raioKm, setRaioKm] = useState(5);
  const [precoMax, setPrecoMax] = useState('');
  const [categoria, setCategoria] = useState('');

  const query: ListarAnunciosQuery | null = coords
    ? {
        lat: coords.latitude,
        lng: coords.longitude,
        raio_km: raioKm,
        pagina: 1,
        ...(precoMax ? { preco_max: Number(precoMax) } : {}),
        ...(categoria ? { categoria } : {}),
      }
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ['anuncios', query],
    queryFn: () => api.anuncios.listar(query as ListarAnunciosQuery),
    enabled: query !== null,
  });

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Ofertas perto de você</h1>

      {erro && !coords && (
        <div className="mt-4 rounded-lg border border-surface-200 bg-white p-4">
          <p className="text-sm text-ink-700">
            Não conseguimos acessar sua localização. Use o centro de São Paulo para ver ofertas.
          </p>
          <button
            type="button"
            onClick={() => definirManual(CENTRO_SP)}
            className="mt-3 min-h-11 rounded-lg bg-brand-500 px-4 font-medium text-white"
          >
            Usar centro de São Paulo
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex flex-col text-sm text-ink-700">
          Raio
          <select
            aria-label="Raio em km"
            value={raioKm}
            onChange={(e) => setRaioKm(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-surface-200 px-2"
          >
            {RAIOS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-ink-700">
          Preço máx.
          <input
            aria-label="Preço máximo"
            type="number"
            min="0"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            className="min-h-11 w-28 rounded-lg border border-surface-200 px-2"
          />
        </label>

        <label className="flex flex-col text-sm text-ink-700">
          Categoria
          <select
            aria-label="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="min-h-11 rounded-lg border border-surface-200 px-2"
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="mt-4 flex flex-col gap-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {data.map((oferta) => (
            <li key={oferta.id}>
              <OfertaCard oferta={oferta} />
            </li>
          ))}
        </ul>
      )}

      {data && data.length === 0 && (
        <div className="mt-6 text-center">
          <p className="text-ink-700">Nenhuma oferta encontrada por aqui.</p>
          <button
            type="button"
            onClick={() => setRaioKm((r) => Math.min(r * 2, 50))}
            className="mt-3 min-h-11 rounded-lg bg-accent-500 px-4 font-medium text-white"
          >
            Ampliar raio
          </button>
        </div>
      )}
    </main>
  );
}

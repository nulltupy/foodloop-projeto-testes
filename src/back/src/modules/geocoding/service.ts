import { ErrorCode } from '@foodloop/lib';
import Bottleneck from 'bottleneck';

import { HttpError } from '../../shared/errors.js';

// Nominatim exige User-Agent identificável com contato (usage policy). Sem isso
// o serviço bloqueia o IP. ViaCEP não exige, mas mandamos o mesmo por consistência.
const USER_AGENT = 'FoodLoop/0.1 (contato: arpinigabrielsr71@gmail.com)';
const VIACEP_BASE = 'https://viacep.com.br/ws';
const NOMINATIM_BASE =
  'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&addressdetails=0';

const UPSTREAM_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ≤1 req/s no Nominatim (usage policy). minTime 1100ms dá folga. ViaCEP não passa
// pelo limiter porque não tem teto documentado e serializar tudo dobraria a latência.
const nominatimLimiter = new Bottleneck({ minTime: 1100 });

export interface Coords {
  latitude: number;
  longitude: number;
  endereco_normalizado: string;
}

interface ViaCepResposta {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

const cache = new Map<string, { value: Coords; expira: number }>();

function lerCache(chave: string): Coords | undefined {
  const hit = cache.get(chave);
  if (hit && hit.expira > Date.now()) return hit.value;
  return undefined;
}

function gravarCache(chave: string, value: Coords): void {
  cache.set(chave, { value, expira: Date.now() + CACHE_TTL_MS });
}

async function buscar(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    // Timeout (AbortError) ou erro de rede: tratamos como upstream indisponível.
    throw new HttpError(502, ErrorCode.GEOCODING_UPSTREAM_ERRO, 'Falha ao consultar geocoding');
  }
}

// CEP → endereço textual via ViaCEP. Retorna a query a ser geocodificada pelo Nominatim.
async function cepParaEndereco(cep: string): Promise<string> {
  const resp = await buscar(`${VIACEP_BASE}/${cep}/json/`);
  if (resp.status === 429) {
    throw new HttpError(503, ErrorCode.GEOCODING_INDISPONIVEL, 'Geocoding ocupado, tente em instantes');
  }
  if (!resp.ok) {
    throw new HttpError(502, ErrorCode.GEOCODING_UPSTREAM_ERRO, 'Falha ao consultar CEP');
  }
  const data = (await resp.json()) as ViaCepResposta;
  // ViaCEP responde 200 com { erro: true } para CEP inexistente.
  if (data.erro || !data.localidade || !data.uf) {
    throw new HttpError(422, ErrorCode.GEOCODING_FALHOU, 'CEP não localizado');
  }
  return [data.logradouro, data.bairro, data.localidade, data.uf, 'Brasil']
    .filter((parte) => parte && parte.trim().length > 0)
    .join(', ');
}

// Endereço textual → coordenadas via Nominatim.
async function enderecoParaCoords(query: string): Promise<Coords> {
  const url = `${NOMINATIM_BASE}&q=${encodeURIComponent(query)}`;
  const resp = await nominatimLimiter.schedule(() => buscar(url));
  if (resp.status === 429) {
    throw new HttpError(503, ErrorCode.GEOCODING_INDISPONIVEL, 'Geocoding ocupado, tente em instantes');
  }
  if (resp.status === 404) {
    throw new HttpError(422, ErrorCode.GEOCODING_FALHOU, 'Endereço não localizado');
  }
  if (!resp.ok) {
    throw new HttpError(502, ErrorCode.GEOCODING_UPSTREAM_ERRO, 'Falha no geocoding');
  }
  const data = (await resp.json()) as NominatimItem[];
  const item = data?.[0];
  if (!item) {
    throw new HttpError(422, ErrorCode.GEOCODING_FALHOU, 'Endereço não localizado');
  }
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new HttpError(502, ErrorCode.GEOCODING_UPSTREAM_ERRO, 'Coordenadas inválidas no upstream');
  }
  return { latitude, longitude, endereco_normalizado: item.display_name };
}

/** Resolve um CEP brasileiro em coordenadas. ViaCEP (CEP→endereço) → Nominatim (endereço→lat/lng). */
export async function geocodingCep(cepRaw: string): Promise<Coords> {
  const cep = cepRaw.replace(/\D/g, '');
  if (cep.length !== 8) {
    throw new HttpError(400, ErrorCode.VALIDACAO, 'CEP inválido');
  }
  const chave = `cep:${cep}`;
  const cacheado = lerCache(chave);
  if (cacheado) return cacheado;

  const endereco = await cepParaEndereco(cep);
  const coords = await enderecoParaCoords(endereco);
  gravarCache(chave, coords);
  return coords;
}

/** Geocodifica um endereço textual completo. Uso interno (ex.: criação de estabelecimento). */
export async function geocodingEndereco(query: string): Promise<Coords> {
  const chave = `addr:${query.toLowerCase()}`;
  const cacheado = lerCache(chave);
  if (cacheado) return cacheado;

  const coords = await enderecoParaCoords(query);
  gravarCache(chave, coords);
  return coords;
}

/**
 * Geocodifica tentando uma lista de queries da mais específica para a mais ampla.
 * O Nominatim costuma não achar o número da casa nem o bairro em endereços
 * brasileiros; cair até rua/cidade evita rejeições falsas sem aceitar centroides
 * genéricos de bairro/cidade. Só o "não encontrado" (GEOCODING_FALHOU) faz tentar
 * a próxima — erros de upstream/limite sobem na hora.
 */
export async function geocodingEnderecoComFallback(queries: string[]): Promise<Coords> {
  const candidatas = queries.filter((q) => q && q.trim().length > 0);
  let ultimaFalha: unknown;
  for (const query of candidatas) {
    try {
      return await geocodingEndereco(query);
    } catch (e) {
      if (e instanceof HttpError && e.code === ErrorCode.GEOCODING_FALHOU) {
        ultimaFalha = e;
        continue;
      }
      throw e;
    }
  }
  throw ultimaFalha ?? new HttpError(422, ErrorCode.GEOCODING_FALHOU, 'Endereço não localizado');
}

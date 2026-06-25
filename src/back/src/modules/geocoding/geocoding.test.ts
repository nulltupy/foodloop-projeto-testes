import { ErrorCode } from '@foodloop/lib';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app.js';

import { geocodingCep } from './service.js';

type FetchArgs = Parameters<typeof fetch>;

interface UpstreamStub {
  viacep?: { body: unknown; status?: number };
  nominatim?: { body: unknown; status?: number };
}

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

// Roteia o fetch mockado para ViaCEP ou Nominatim conforme a URL.
function stubFetch(stub: UpstreamStub) {
  const fn = vi.fn(async (...args: FetchArgs) => {
    const url = String(args[0]);
    if (url.includes('viacep.com.br')) {
      const v = stub.viacep ?? { body: {}, status: 200 };
      return jsonResponse(v.body, v.status ?? 200);
    }
    const n = stub.nominatim ?? { body: [], status: 200 };
    return jsonResponse(n.body, n.status ?? 200);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const VIACEP_OK = { logradouro: 'Avenida Amazonas', bairro: 'Centro', localidade: 'Betim', uf: 'MG' };
const NOMINATIM_OK = [
  { lat: '-19.9676', lon: '-44.1986', display_name: 'Avenida Amazonas, Centro, Betim, MG, Brasil' },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('geocodingCep (service)', () => {
  it('resolve CEP válido em coordenadas via ViaCEP→Nominatim', async () => {
    const fetchMock = stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: NOMINATIM_OK } });

    const coords = await geocodingCep('32600-001');

    expect(coords).toEqual({
      latitude: -19.9676,
      longitude: -44.1986,
      endereco_normalizado: 'Avenida Amazonas, Centro, Betim, MG, Brasil',
    });
    // ViaCEP primeiro, depois Nominatim com countrycodes=br.
    expect(String(fetchMock.mock.calls[0]![0])).toContain('viacep.com.br');
    expect(String(fetchMock.mock.calls[1]![0])).toContain('countrycodes=br');
  });

  it('usa cache na 2ª chamada do mesmo CEP (sem novo fetch)', async () => {
    const fetchMock = stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: NOMINATIM_OK } });

    await geocodingCep('32600-002');
    const chamadasApos1a = fetchMock.mock.calls.length;
    await geocodingCep('32600-002');

    expect(fetchMock.mock.calls.length).toBe(chamadasApos1a);
  });

  it('rejeita CEP com formato inválido sem chamar upstream (400)', async () => {
    const fetchMock = stubFetch({});

    await expect(geocodingCep('123')).rejects.toMatchObject({
      status: 400,
      code: ErrorCode.VALIDACAO,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mapeia CEP inexistente (ViaCEP erro:true) para 422 GEOCODING_FALHOU', async () => {
    stubFetch({ viacep: { body: { erro: true } } });

    await expect(geocodingCep('32600-003')).rejects.toMatchObject({
      status: 422,
      code: ErrorCode.GEOCODING_FALHOU,
    });
  });

  it('mapeia Nominatim vazio para 422 GEOCODING_FALHOU', async () => {
    stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: [] } });

    await expect(geocodingCep('32600-004')).rejects.toMatchObject({
      status: 422,
      code: ErrorCode.GEOCODING_FALHOU,
    });
  });

  it('mapeia Nominatim 429 para 503 GEOCODING_INDISPONIVEL', async () => {
    stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: [], status: 429 } });

    await expect(geocodingCep('32600-005')).rejects.toMatchObject({
      status: 503,
      code: ErrorCode.GEOCODING_INDISPONIVEL,
    });
  });

  it('mapeia Nominatim 500 para 502 GEOCODING_UPSTREAM_ERRO', async () => {
    stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: {}, status: 500 } });

    await expect(geocodingCep('32600-006')).rejects.toMatchObject({
      status: 502,
      code: ErrorCode.GEOCODING_UPSTREAM_ERRO,
    });
  });
});

describe('GET /api/v1/geocoding/cep (controller)', () => {
  it('retorna 400 VALIDACAO quando falta o cep', async () => {
    stubFetch({});
    const res = await request(buildApp()).get('/api/v1/geocoding/cep');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('bloqueia a 6ª request do mesmo IP em <1min com 429 RATE_LIMIT', async () => {
    stubFetch({ viacep: { body: VIACEP_OK }, nominatim: { body: NOMINATIM_OK } });
    const app = buildApp();

    // Mesmo CEP: a 1ª aquece o cache, as seguintes batem o cache (sem upstream),
    // isolando o teste do rate limit do Nominatim.
    for (let i = 0; i < 5; i++) {
      const ok = await request(app).get('/api/v1/geocoding/cep?cep=32600007');
      expect(ok.status).toBe(200);
    }
    const bloqueada = await request(app).get('/api/v1/geocoding/cep?cep=32600007');
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.error.code).toBe(ErrorCode.RATE_LIMIT);
  });
});

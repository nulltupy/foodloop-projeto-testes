import { getApiClient } from './client.js';
import {
  EstabelecimentoSchema,
  type CreateEstabelecimentoRequest,
  type Estabelecimento,
  type UpdateEstabelecimentoRequest,
} from '../schemas/estabelecimento.js';

export async function criar(data: CreateEstabelecimentoRequest): Promise<Estabelecimento> {
  const r = await getApiClient().post('/api/v1/estabelecimentos', data);
  return EstabelecimentoSchema.parse(r.data);
}

export async function getMeu(): Promise<Estabelecimento> {
  const r = await getApiClient().get('/api/v1/estabelecimentos/me');
  return EstabelecimentoSchema.parse(r.data);
}

export async function getById(id: number): Promise<Estabelecimento> {
  const r = await getApiClient().get(`/api/v1/estabelecimentos/${id}`);
  return EstabelecimentoSchema.parse(r.data);
}

export async function atualizar(data: UpdateEstabelecimentoRequest): Promise<Estabelecimento> {
  const r = await getApiClient().patch('/api/v1/estabelecimentos/me', data);
  return EstabelecimentoSchema.parse(r.data);
}

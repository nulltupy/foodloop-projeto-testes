import { getApiClient } from './client.js';
import {
  ProdutoSchema,
  type CreateProdutoRequest,
  type Produto,
  type UpdateProdutoRequest,
} from '../schemas/produto.js';
import { z } from 'zod';

const ProdutoListSchema = z.array(ProdutoSchema);

export async function criar(data: CreateProdutoRequest): Promise<Produto> {
  const r = await getApiClient().post('/api/v1/produtos', data);
  return ProdutoSchema.parse(r.data);
}

export async function listarMeus(): Promise<Produto[]> {
  const r = await getApiClient().get('/api/v1/produtos');
  return ProdutoListSchema.parse(r.data);
}

export async function atualizar(id: number, data: UpdateProdutoRequest): Promise<Produto> {
  const r = await getApiClient().patch(`/api/v1/produtos/${id}`, data);
  return ProdutoSchema.parse(r.data);
}

export async function desativar(id: number): Promise<void> {
  await getApiClient().delete(`/api/v1/produtos/${id}`);
}

export async function listarPorEstabelecimento(idEstabelecimento: number): Promise<Produto[]> {
  const r = await getApiClient().get(`/api/v1/estabelecimentos/${idEstabelecimento}/produtos`);
  return ProdutoListSchema.parse(r.data);
}

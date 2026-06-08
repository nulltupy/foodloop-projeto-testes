import { getApiClient } from './client.js';
import {
  AnuncioListItemSchema,
  AnuncioSchema,
  type Anuncio,
  type AnuncioListItem,
  type CreateAnuncioRequest,
  type ListarAnunciosQuery,
  type UpdateAnuncioRequest,
} from '../schemas/anuncio.js';
import { z } from 'zod';

const AnuncioListSchema = z.array(AnuncioListItemSchema);
const AnuncioMineListSchema = z.array(AnuncioSchema);

export async function listar(query: ListarAnunciosQuery): Promise<AnuncioListItem[]> {
  const r = await getApiClient().get('/api/v1/anuncios', { params: query });
  return AnuncioListSchema.parse(r.data);
}

export async function listarMeus(): Promise<Anuncio[]> {
  const r = await getApiClient().get('/api/v1/anuncios/meus');
  return AnuncioMineListSchema.parse(r.data);
}

export async function getById(id: number): Promise<Anuncio> {
  const r = await getApiClient().get(`/api/v1/anuncios/${id}`);
  return AnuncioSchema.parse(r.data);
}

export async function criar(data: CreateAnuncioRequest): Promise<Anuncio> {
  const r = await getApiClient().post('/api/v1/anuncios', data);
  return AnuncioSchema.parse(r.data);
}

export async function atualizar(id: number, data: UpdateAnuncioRequest): Promise<Anuncio> {
  const r = await getApiClient().patch(`/api/v1/anuncios/${id}`, data);
  return AnuncioSchema.parse(r.data);
}

export async function encerrar(id: number): Promise<Anuncio> {
  const r = await getApiClient().post(`/api/v1/anuncios/${id}/encerrar`);
  return AnuncioSchema.parse(r.data);
}

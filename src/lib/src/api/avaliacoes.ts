import { z } from 'zod';
import { getApiClient } from './client.js';
import {
  AvaliacaoPerfilItemSchema,
  AvaliacaoSchema,
  ComentarioAvaliacaoSchema,
  type Avaliacao,
  type AvaliacaoPerfilItem,
  type ComentarioAvaliacao,
  type CriarAvaliacaoRequest,
  type CriarComentarioRequest,
} from '../schemas/avaliacao.js';

export async function criar(data: CriarAvaliacaoRequest): Promise<Avaliacao> {
  const r = await getApiClient().post('/api/v1/avaliacoes', data);
  return AvaliacaoSchema.parse(r.data);
}

export async function listarDoEstabelecimento(idEstabelecimento: number): Promise<AvaliacaoPerfilItem[]> {
  const r = await getApiClient().get(`/api/v1/estabelecimentos/${idEstabelecimento}/avaliacoes`);
  return z.array(AvaliacaoPerfilItemSchema).parse(r.data);
}

export async function comentar(
  idAvaliacao: number,
  data: CriarComentarioRequest,
): Promise<ComentarioAvaliacao> {
  const r = await getApiClient().post(`/api/v1/avaliacoes/${idAvaliacao}/comentarios`, data);
  return ComentarioAvaliacaoSchema.parse(r.data);
}

export async function listarComentarios(idAvaliacao: number): Promise<ComentarioAvaliacao[]> {
  const r = await getApiClient().get(`/api/v1/avaliacoes/${idAvaliacao}/comentarios`);
  return z.array(ComentarioAvaliacaoSchema).parse(r.data);
}

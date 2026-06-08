import { getApiClient } from './client.js';
import {
  PedidoSchema,
  type AtualizarStatusRequest,
  type CriarPedidoRequest,
  type Pedido,
} from '../schemas/pedido.js';
import { z } from 'zod';

const PedidoListSchema = z.array(PedidoSchema);

export async function criar(data: CriarPedidoRequest): Promise<Pedido> {
  const r = await getApiClient().post('/api/v1/pedidos', data);
  return PedidoSchema.parse(r.data);
}

export async function listarMeus(): Promise<Pedido[]> {
  const r = await getApiClient().get('/api/v1/pedidos/meus');
  return PedidoListSchema.parse(r.data);
}

export async function listarComerciante(): Promise<Pedido[]> {
  const r = await getApiClient().get('/api/v1/pedidos/comerciante');
  return PedidoListSchema.parse(r.data);
}

export async function getById(id: number): Promise<Pedido> {
  const r = await getApiClient().get(`/api/v1/pedidos/${id}`);
  return PedidoSchema.parse(r.data);
}

export async function avancarStatus(id: number, data: AtualizarStatusRequest): Promise<Pedido> {
  const r = await getApiClient().patch(`/api/v1/pedidos/${id}/status`, data);
  return PedidoSchema.parse(r.data);
}

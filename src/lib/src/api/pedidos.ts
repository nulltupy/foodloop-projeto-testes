import { getApiClient } from './client.js';
import {
  PedidoClienteListItemSchema,
  PedidoComercianteListItemSchema,
  PedidoSchema,
  type AtualizarStatusRequest,
  type CancelarPedidoRequest,
  type CriarPedidoRequest,
  type Pedido,
  type PedidoClienteListItem,
  type PedidoComercianteListItem,
} from '../schemas/pedido.js';
import { z } from 'zod';

// As listagens vêm envelopadas em { data, meta } por causa da paginação.
// Só os itens interessam para a UI; o meta é descartado.
const MetaSchema = z.object({ pagina: z.number(), tamanho: z.number(), total: z.number() });
const PedidosClienteResponseSchema = z.object({
  data: z.array(PedidoClienteListItemSchema),
  meta: MetaSchema,
});
const PedidosComercianteResponseSchema = z.object({
  data: z.array(PedidoComercianteListItemSchema),
  meta: MetaSchema,
});

export async function criar(data: CriarPedidoRequest): Promise<Pedido> {
  const r = await getApiClient().post('/api/v1/pedidos', data);
  return PedidoSchema.parse(r.data);
}

export async function listarMeus(): Promise<PedidoClienteListItem[]> {
  const r = await getApiClient().get('/api/v1/pedidos/meus');
  return PedidosClienteResponseSchema.parse(r.data).data;
}

export async function listarComerciante(): Promise<PedidoComercianteListItem[]> {
  const r = await getApiClient().get('/api/v1/pedidos/comerciante');
  return PedidosComercianteResponseSchema.parse(r.data).data;
}

export async function getById(id: number): Promise<Pedido> {
  const r = await getApiClient().get(`/api/v1/pedidos/${id}`);
  return PedidoSchema.parse(r.data);
}

export async function avancarStatus(id: number, data: AtualizarStatusRequest): Promise<Pedido> {
  const r = await getApiClient().patch(`/api/v1/pedidos/${id}/status`, data);
  return PedidoSchema.parse(r.data);
}

export async function cancelar(id: number, data: CancelarPedidoRequest = {}): Promise<Pedido> {
  const r = await getApiClient().post(`/api/v1/pedidos/${id}/cancelar`, data);
  return PedidoSchema.parse(r.data);
}

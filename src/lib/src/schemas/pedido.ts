import { z } from 'zod';

export const StatusPedidoSchema = z.enum([
  'RECEBIDO',
  'EM_PREPARO',
  'PRONTO_PARA_RETIRADA',
  'RETIRADO',
  'CANCELADO',
]);
export type StatusPedido = z.infer<typeof StatusPedidoSchema>;

const ItemPedidoBaseSchema = z.object({
  id_anuncio: z.number().int().positive(),
  quantidade: z.number().int().positive().max(20),
});

export const ItemPedidoSchema = ItemPedidoBaseSchema.extend({
  id: z.number().int().positive(),
  preco_unitario: z.number().positive(),
  subtotal: z.number().positive(),
});
export type ItemPedido = z.infer<typeof ItemPedidoSchema>;

export const PedidoSchema = z.object({
  id: z.number().int().positive(),
  id_cliente: z.number().int().positive(),
  id_estabelecimento: z.number().int().positive(),
  valor_total: z.number().positive(),
  status: StatusPedidoSchema,
  codigo_retirada: z.string().length(8),
  data_pedido: z.string().datetime(),
  itens: z.array(ItemPedidoSchema),
});
export type Pedido = z.infer<typeof PedidoSchema>;

export const CriarPedidoRequestSchema = z.object({
  itens: z.array(ItemPedidoBaseSchema).min(1).max(1), // MVP: 1 item por pedido
});
export type CriarPedidoRequest = z.infer<typeof CriarPedidoRequestSchema>;

export const AtualizarStatusRequestSchema = z.object({
  novo_status: StatusPedidoSchema,
  codigo_retirada: z.string().length(8).optional(),
});
export type AtualizarStatusRequest = z.infer<typeof AtualizarStatusRequestSchema>;

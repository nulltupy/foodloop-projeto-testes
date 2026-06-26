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

// Item como aparece nas listagens (/meus e /comerciante): traz o nome do
// produto resolvido no lugar do id_anuncio.
export const ItemPedidoResumoSchema = z.object({
  id: z.number().int().positive(),
  produto_nome: z.string(),
  quantidade: z.number().int().positive(),
  preco_unitario: z.number().positive(),
  subtotal: z.number().positive(),
});
export type ItemPedidoResumo = z.infer<typeof ItemPedidoResumoSchema>;

const PedidoListaBaseSchema = z.object({
  id: z.number().int().positive(),
  status: StatusPedidoSchema,
  valor_total: z.number().positive(),
  data_pedido: z.string().datetime(),
  itens: z.array(ItemPedidoResumoSchema),
});

// Listagem do cliente (GET /pedidos/meus): inclui o código de retirada e os
// dados do estabelecimento onde retirar.
export const PedidoClienteListItemSchema = PedidoListaBaseSchema.extend({
  codigo_retirada: z.string().length(8),
  estabelecimento: z.object({
    id: z.number().int().positive(),
    nome_fantasia: z.string(),
  }),
});
export type PedidoClienteListItem = z.infer<typeof PedidoClienteListItemSchema>;

// Listagem do comerciante (GET /pedidos/comerciante): inclui o cliente e omite
// o código de retirada (que só o cliente apresenta na hora da retirada).
export const PedidoComercianteListItemSchema = PedidoListaBaseSchema.extend({
  cliente: z.object({ nome: z.string() }),
});
export type PedidoComercianteListItem = z.infer<typeof PedidoComercianteListItemSchema>;

export const CriarPedidoRequestSchema = z.object({
  itens: z.array(ItemPedidoBaseSchema).min(1).max(1), // MVP: 1 item por pedido
});
export type CriarPedidoRequest = z.infer<typeof CriarPedidoRequestSchema>;

export const AtualizarStatusRequestSchema = z.object({
  novo_status: StatusPedidoSchema,
  codigo_retirada: z.string().length(8).optional(),
});
export type AtualizarStatusRequest = z.infer<typeof AtualizarStatusRequestSchema>;

export const CancelarPedidoRequestSchema = z.object({
  motivo: z.string().max(255).optional(),
});
export type CancelarPedidoRequest = z.infer<typeof CancelarPedidoRequestSchema>;

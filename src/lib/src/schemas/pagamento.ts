import { z } from 'zod';

export const FormaPagamentoSchema = z.enum(['PIX', 'CARTAO_CREDITO']);
export type FormaPagamento = z.infer<typeof FormaPagamentoSchema>;

export const StatusPagamentoSchema = z.enum(['PENDENTE', 'APROVADO', 'RECUSADO']);
export type StatusPagamento = z.infer<typeof StatusPagamentoSchema>;

export const PagamentoSchema = z.object({
  id: z.number().int().positive(),
  id_pedido: z.number().int().positive(),
  valor: z.number().positive(),
  forma_pagamento: FormaPagamentoSchema,
  status_pagamento: StatusPagamentoSchema,
});
export type Pagamento = z.infer<typeof PagamentoSchema>;

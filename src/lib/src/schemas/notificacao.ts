import { z } from 'zod';

export const NotificacaoSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string(),
  corpo: z.string(),
  deep_link: z.string().nullable(),
  lida: z.boolean(),
  data_envio: z.string().datetime(),
});
export type Notificacao = z.infer<typeof NotificacaoSchema>;

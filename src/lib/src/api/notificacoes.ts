import { getApiClient } from './client.js';
import { NotificacaoSchema, type Notificacao } from '../schemas/notificacao.js';
import { z } from 'zod';

// A listagem vem envelopada em { data, meta }; meta.nao_lidas alimenta o badge.
const ListaResponseSchema = z.object({
  data: z.array(NotificacaoSchema),
  meta: z.object({
    pagina: z.number(),
    tamanho: z.number(),
    total: z.number(),
    nao_lidas: z.number(),
  }),
});

export interface ListaNotificacoes {
  itens: Notificacao[];
  naoLidas: number;
}

export async function listar(params?: { lida?: boolean }): Promise<ListaNotificacoes> {
  const r = await getApiClient().get('/api/v1/notificacoes', { params });
  const parsed = ListaResponseSchema.parse(r.data);
  return { itens: parsed.data, naoLidas: parsed.meta.nao_lidas };
}

export async function marcarLida(id: number): Promise<void> {
  await getApiClient().patch(`/api/v1/notificacoes/${id}/lida`);
}

export async function lerTodas(): Promise<number> {
  const r = await getApiClient().patch('/api/v1/notificacoes/ler-todas');
  return z.object({ atualizadas: z.number() }).parse(r.data).atualizadas;
}

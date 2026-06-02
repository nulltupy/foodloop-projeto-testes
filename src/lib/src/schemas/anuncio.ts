import { z } from 'zod';

export const StatusAnuncioSchema = z.enum(['ATIVO', 'ENCERRADO_COM_SOBRA', 'ENCERRADO_COM_RESERVA']);
export type StatusAnuncio = z.infer<typeof StatusAnuncioSchema>;

export const AnuncioSchema = z.object({
  id: z.number().int().positive(),
  id_produto: z.number().int().positive(),
  id_estabelecimento: z.number().int().positive(),
  preco_promocional: z.number().positive(),
  quantidade_inicial: z.number().int().positive(),
  quantidade_disponivel: z.number().int().nonnegative(),
  prazo_retirada: z.string().datetime(),
  status: StatusAnuncioSchema,
});
export type Anuncio = z.infer<typeof AnuncioSchema>;

// Item leve da listagem geo (com produto + estab embarcados e distância).
export const AnuncioListItemSchema = AnuncioSchema.extend({
  produto_nome: z.string(),
  produto_imagem: z.string().url().nullable().optional(),
  preco_regular: z.number().positive(),
  estabelecimento_id: z.number().int().positive(),
  nome_fantasia: z.string(),
  nota_media: z.number().min(0).max(5).nullable().optional(),
  distancia_km: z.number().nonnegative(),
});
export type AnuncioListItem = z.infer<typeof AnuncioListItemSchema>;

export const CreateAnuncioRequestSchema = z.object({
  id_produto: z.number().int().positive(),
  preco_promocional: z.number().positive(),
  quantidade_inicial: z.number().int().positive(),
  prazo_retirada: z.string().datetime(),
});
export type CreateAnuncioRequest = z.infer<typeof CreateAnuncioRequestSchema>;

export const UpdateAnuncioRequestSchema = CreateAnuncioRequestSchema.partial();
export type UpdateAnuncioRequest = z.infer<typeof UpdateAnuncioRequestSchema>;

export const ListarAnunciosQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  raio_km: z.coerce.number().positive().max(50).default(5),
  preco_max: z.coerce.number().positive().optional(),
  categoria: z.string().optional(),
  pagina: z.coerce.number().int().positive().default(1),
});
export type ListarAnunciosQuery = z.infer<typeof ListarAnunciosQuerySchema>;

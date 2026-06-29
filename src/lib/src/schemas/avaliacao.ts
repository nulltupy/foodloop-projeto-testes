import { z } from 'zod';
import { TipoUsuarioSchema } from './comum.js';

// Nota inteira de 1 a 5 estrelas — sem meia-estrela (regra do produto).
export const NotaSchema = z.number().int().min(1).max(5);

// Criação de uma avaliação a partir de um pedido entregue do próprio cliente.
// Uma avaliação por pedido (garantido pela uq_avaliacao_pedido no banco).
export const CriarAvaliacaoRequestSchema = z.object({
  id_pedido: z.number().int().positive(),
  nota: NotaSchema,
  comentario: z.string().trim().max(500).optional(),
});
export type CriarAvaliacaoRequest = z.infer<typeof CriarAvaliacaoRequestSchema>;

// Avaliação como retornada ao criar (POST /avaliacoes).
export const AvaliacaoSchema = z.object({
  id: z.number().int().positive(),
  id_pedido: z.number().int().positive(),
  id_estabelecimento: z.number().int().positive(),
  nota: NotaSchema,
  comentario: z.string().nullable(),
  data_avaliacao: z.string().datetime(),
});
export type Avaliacao = z.infer<typeof AvaliacaoSchema>;

// Comentário público numa avaliação (thread). O autor é o cliente que avaliou
// ou o comerciante dono do estabelecimento avaliado.
export const ComentarioAvaliacaoSchema = z.object({
  id: z.number().int().positive(),
  id_avaliacao: z.number().int().positive(),
  comentario: z.string(),
  data_comentario: z.string().datetime(),
  autor: z.object({ nome: z.string(), tipo: TipoUsuarioSchema }),
});
export type ComentarioAvaliacao = z.infer<typeof ComentarioAvaliacaoSchema>;

export const CriarComentarioRequestSchema = z.object({
  comentario: z.string().trim().min(1).max(500),
});
export type CriarComentarioRequest = z.infer<typeof CriarComentarioRequestSchema>;

// Avaliação como aparece no perfil do estabelecimento (GET
// /estabelecimentos/:id/avaliacoes): traz o nome do autor e a thread de
// comentários resolvida.
export const AvaliacaoPerfilItemSchema = z.object({
  id: z.number().int().positive(),
  nota: NotaSchema,
  comentario: z.string().nullable(),
  data_avaliacao: z.string().datetime(),
  autor: z.object({ nome: z.string() }),
  comentarios: z.array(ComentarioAvaliacaoSchema),
});
export type AvaliacaoPerfilItem = z.infer<typeof AvaliacaoPerfilItemSchema>;

import { z } from 'zod';
import { CreateEnderecoRequestSchema, EnderecoSchema } from './endereco.js';

export const EstabelecimentoSchema = z.object({
  id: z.number().int().positive(),
  nome_fantasia: z.string().min(2).max(120),
  descricao: z.string().max(500).nullable().optional(),
  horario_funcionamento: z.string().max(120).nullable().optional(),
  nota_media: z.number().min(0).max(5).nullable().optional(),
  ativo: z.boolean(),
  endereco: EnderecoSchema,
});
export type Estabelecimento = z.infer<typeof EstabelecimentoSchema>;

export const CreateEstabelecimentoRequestSchema = z.object({
  nome_fantasia: z.string().min(2).max(120),
  descricao: z.string().max(500).optional(),
  horario_funcionamento: z.string().trim().min(1).max(120).optional(),
  endereco: CreateEnderecoRequestSchema,
});
export type CreateEstabelecimentoRequest = z.infer<typeof CreateEstabelecimentoRequestSchema>;

export const UpdateEstabelecimentoRequestSchema = CreateEstabelecimentoRequestSchema.partial();
export type UpdateEstabelecimentoRequest = z.infer<typeof UpdateEstabelecimentoRequestSchema>;

export const FecharEstabelecimentoRequestSchema = z.object({
  motivo: z.string().max(255).optional(),
});
export type FecharEstabelecimentoRequest = z.infer<typeof FecharEstabelecimentoRequestSchema>;

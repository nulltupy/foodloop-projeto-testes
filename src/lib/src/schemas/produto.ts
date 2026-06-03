import { z } from 'zod';

export const ProdutoSchema = z.object({
  id: z.number().int().positive(),
  id_estabelecimento: z.number().int().positive(),
  nome: z.string().min(2).max(120),
  descricao: z.string().max(500).nullable().optional(),
  preco_regular: z.number().positive(),
  categoria: z.string().min(2).max(40),
  imagem: z.string().url().nullable().optional(),
  ativo: z.boolean(),
});
export type Produto = z.infer<typeof ProdutoSchema>;

export const CreateProdutoRequestSchema = ProdutoSchema.omit({
  id: true,
  id_estabelecimento: true,
  ativo: true,
});
export type CreateProdutoRequest = z.infer<typeof CreateProdutoRequestSchema>;

export const UpdateProdutoRequestSchema = CreateProdutoRequestSchema.partial();
export type UpdateProdutoRequest = z.infer<typeof UpdateProdutoRequestSchema>;

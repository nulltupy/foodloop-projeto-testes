import { z } from 'zod';
import { TipoUsuarioSchema } from './comum.js';

// Usuário público (nunca inclui senha_hash). Espelha GET /usuarios/me: telefone
// pode ser nulo e há foto_url opcional.
export const UsuarioSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  telefone: z.string().nullable(),
  tipo: TipoUsuarioSchema,
  foto_url: z.string().nullable().optional(),
  data_cadastro: z.string().datetime().optional(),
});
export type Usuario = z.infer<typeof UsuarioSchema>;

export const UpdateUsuarioRequestSchema = z
  .object({
    nome: z.string().min(2).max(120).optional(),
    telefone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    foto_url: z.string().url().max(255).optional(),
  })
  .refine((d) => d.nome !== undefined || d.telefone !== undefined || d.foto_url !== undefined, {
    message: 'Pelo menos um campo deve ser fornecido',
  });
export type UpdateUsuarioRequest = z.infer<typeof UpdateUsuarioRequestSchema>;

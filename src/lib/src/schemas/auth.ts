import { z } from 'zod';
import { TipoUsuarioSchema } from './comum.js';

export const RegisterRequestSchema = z
  .object({
    nome: z.string().min(2).max(120),
    email: z.string().email().toLowerCase(),
    senha: z.string().min(8).max(128),
    telefone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone em formato E.164'),
    tipo: TipoUsuarioSchema,
    cnpj: z
      .string()
      .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos numéricos')
      .optional(),
  })
  .refine((d) => d.tipo !== 'comerciante' || !!d.cnpj, {
    message: 'CNPJ obrigatório para comerciante',
    path: ['cnpj'],
  });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  senha: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  usuario: z.object({
    id: z.number().int().positive(),
    nome: z.string(),
    email: z.string().email(),
    tipo: TipoUsuarioSchema,
  }),
  token: z.string().min(1),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

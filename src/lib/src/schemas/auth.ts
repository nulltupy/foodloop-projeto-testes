import { z } from 'zod';
import { TipoUsuarioSchema } from './comum.js';
import { CreateEstabelecimentoRequestSchema } from './estabelecimento.js';

const NomeSchema = z.string().trim().min(2).max(120);
const EmailSchema = z.string().trim().toLowerCase().email();
const SenhaSchema = z
  .string()
  .min(8)
  .refine((s) => new TextEncoder().encode(s).length <= 72, {
    message: 'Senha excede 72 bytes (limite do bcrypt)',
  });
const TelefoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone em formato E.164');
const CnpjSchema = z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos numéricos');

export const RegisterRequestSchema = z
  .object({
    nome: NomeSchema,
    email: EmailSchema,
    // 72 = limite real do bcrypt em bytes (UTF-8). Caracteres acentuados ocupam
    // 2 bytes — checar bytes, não chars, senão truncamos silenciosamente.
    senha: SenhaSchema,
    telefone: TelefoneSchema,
    tipo: TipoUsuarioSchema,
    cnpj: CnpjSchema.optional(),
  })
  .refine((d) => d.tipo !== 'comerciante' || !!d.cnpj, {
    message: 'CNPJ obrigatório para comerciante',
    path: ['cnpj'],
  });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterComercianteRequestSchema = z.object({
  nome: NomeSchema,
  email: EmailSchema,
  senha: SenhaSchema,
  telefone: TelefoneSchema,
  cnpj: CnpjSchema,
  estabelecimento: CreateEstabelecimentoRequestSchema,
});
export type RegisterComercianteRequest = z.infer<typeof RegisterComercianteRequestSchema>;

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

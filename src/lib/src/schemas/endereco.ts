import { z } from 'zod';

const cepRegex = /^\d{5}-?\d{3}$/;

export const EnderecoSchema = z.object({
  id: z.number().int().positive(),
  rua: z.string().min(2).max(120),
  numero: z.string().min(1).max(10),
  bairro: z.string().min(2).max(80),
  cidade: z.string().min(2).max(80),
  estado: z.string().length(2),
  cep: z.string().regex(cepRegex),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  endereco_normalizado: z.string().optional(),
});
export type Endereco = z.infer<typeof EnderecoSchema>;

// Criação: front NÃO envia lat/lng (back computa via geocoding).
export const CreateEnderecoRequestSchema = EnderecoSchema.omit({
  id: true,
  latitude: true,
  longitude: true,
  endereco_normalizado: true,
});
export type CreateEnderecoRequest = z.infer<typeof CreateEnderecoRequestSchema>;

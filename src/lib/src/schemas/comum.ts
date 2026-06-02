import { z } from 'zod';

export const CoordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coords = z.infer<typeof CoordsSchema>;

export const PaginacaoSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(50),
  total: z.number().int().nonnegative(),
});
export type Paginacao = z.infer<typeof PaginacaoSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const TipoUsuarioSchema = z.enum(['cliente', 'comerciante']);
export type TipoUsuario = z.infer<typeof TipoUsuarioSchema>;

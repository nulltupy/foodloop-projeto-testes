import { AuthResponseSchema, ErrorCode, RegisterRequestSchema } from '@foodloop/lib';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

export const authRouter = Router();

// Cap por IP em endpoints de signup: o limiter global (60/min) ainda deixa muito
// espaço pra enumeração/brute-force; aqui apertamos pra 5/min.
const registerLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Em test todos os requests vêm do mesmo IP local; o cap real é exercitado em prod.
  skip: () => process.env.NODE_ENV === 'test',
});

authRouter.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const parsed = RegisterRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      // Só devolvemos os nomes dos campos que falharam — nunca os valores.
      // Frontend já tem o schema em @foodloop/lib e re-valida localmente.
      const fields = Object.keys(parsed.error.flatten().fieldErrors);
      req.log?.info(
        { event: 'auth.register.failure', reason: 'VALIDACAO', ip: req.ip, fields },
        'falha de validação no cadastro',
      );
      throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
    }
    let out;
    try {
      out = await service.registrar(parsed.data);
    } catch (err) {
      if (err instanceof HttpError && err.code === ErrorCode.CADASTRO_DUPLICADO) {
        req.log?.info(
          { event: 'auth.register.failure', reason: 'CADASTRO_DUPLICADO', ip: req.ip },
          'cadastro duplicado',
        );
      }
      throw err;
    }
    // Last-line-of-defense: schema parse no shape de saída garante que nunca
    // vazamos campos sensíveis (senha_hash, etc) se alguém mexer no service.
    const safe = AuthResponseSchema.parse(out);
    req.log?.info(
      {
        event: 'auth.register.success',
        usuarioId: safe.usuario.id,
        tipo: safe.usuario.tipo,
        ip: req.ip,
      },
      'usuario registrado',
    );
    res.status(201).json(safe);
  } catch (e) {
    next(e);
  }
});

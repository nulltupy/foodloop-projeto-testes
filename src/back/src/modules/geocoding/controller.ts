import { ErrorCode } from '@foodloop/lib';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

const QuerySchema = z.object({ cep: z.string().min(8).max(9) });

export function createGeocodingRouter(): Router {
  const router = Router();

  // Rate limit dedicado por IP: o limiter global (60/min) é generoso demais para um
  // endpoint que faz 2 chamadas upstream. 5/min/IP protege nossa cota no Nominatim.
  // Criado dentro do factory (como em app.ts) para isolar o store por instância.
  const geocodingLimiter = rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new HttpError(429, ErrorCode.RATE_LIMIT, 'Muitas consultas; aguarde alguns segundos'));
    },
  });

  router.get('/cep', geocodingLimiter, async (req, res, next) => {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'CEP inválido');
      }
      res.json(await service.geocodingCep(parsed.data.cep));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

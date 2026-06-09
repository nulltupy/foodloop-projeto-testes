import { ErrorCode, ListarAnunciosQuerySchema } from '@foodloop/lib';
import { Router } from 'express';

import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

export function createAnunciosRouter(): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const parsed = ListarAnunciosQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const resposta = await service.listarProximos(parsed.data);
      res.json(resposta);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

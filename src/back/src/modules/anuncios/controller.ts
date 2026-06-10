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

  router.get('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const anuncio = await service.getById(id);
      if (!anuncio) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Anúncio não encontrado');
      }
      res.json(anuncio);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

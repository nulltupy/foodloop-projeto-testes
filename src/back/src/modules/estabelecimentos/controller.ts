import { ErrorCode } from '@foodloop/lib';
import { Router } from 'express';

import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

export function createEstabelecimentosRouter(): Router {
  const router = Router();

  router.get('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const e = await service.getById(id);
      if (!e) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
      }
      res.json(e);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/produtos', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const produtos = await service.listarProdutos(id);
      res.json(produtos);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

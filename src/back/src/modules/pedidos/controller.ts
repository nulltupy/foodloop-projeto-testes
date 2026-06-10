import { CriarPedidoRequestSchema, ErrorCode } from '@foodloop/lib';
import { Router } from 'express';

import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';
import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

export function createPedidosRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, requireRole('cliente'), async (req, res, next) => {
    try {
      const parsed = CriarPedidoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const pedido = await service.criar({
        id_cliente: req.usuario!.id,
        itens: parsed.data.itens,
      });
      res.status(201).json(pedido);
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const pedido = await service.getById(id);
      if (!pedido) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado');
      }
      res.json(pedido);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

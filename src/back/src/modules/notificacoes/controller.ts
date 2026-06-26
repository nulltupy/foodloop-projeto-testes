import { ErrorCode } from '@foodloop/lib';
import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../shared/errors.js';
import { requireAuth } from '../../shared/middlewares/auth.js';

import * as service from './service.js';

const QuerySchema = z.object({
  lida: z.enum(['true', 'false']).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export function createNotificacoesRouter(): Router {
  const router = Router();

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Query inválida');
      }
      const { lida, pagina, limit } = parsed.data;
      res.json(
        await service.listar(req.usuario!.id, {
          lida: lida === undefined ? undefined : lida === 'true',
          pagina,
          limit,
        }),
      );
    } catch (e) {
      next(e);
    }
  });

  // Antes de '/:id/lida' pra "ler-todas" não cair como :id.
  router.patch('/ler-todas', requireAuth, async (req, res, next) => {
    try {
      res.json(await service.marcarTodasLidas(req.usuario!.id));
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id/lida', requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      await service.marcarLida(req.usuario!.id, id);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}

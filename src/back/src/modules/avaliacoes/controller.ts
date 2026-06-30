import { CriarAvaliacaoRequestSchema, CriarComentarioRequestSchema, ErrorCode } from '@foodloop/lib';
import { Router } from 'express';

import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';
import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

function parseId(valor: unknown): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
  }
  return id;
}

export function createAvaliacoesRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, requireRole('cliente'), async (req, res, next) => {
    try {
      const parsed = CriarAvaliacaoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const avaliacao = await service.criar(req.usuario!.id, parsed.data);
      res.status(201).json(avaliacao);
    } catch (e) {
      next(e);
    }
  });

  // Comentar é de cliente ou comerciante; a autorização específica é no service.
  router.post('/:id/comentarios', requireAuth, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const parsed = CriarComentarioRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido');
      }
      const comentario = await service.comentar(req.usuario!, id, parsed.data.comentario);
      res.status(201).json(comentario);
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id/comentarios', async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      res.json(await service.listarComentarios(id));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

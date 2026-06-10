import {
  CreateProdutoRequestSchema,
  ErrorCode,
  ProdutoSchema,
  UpdateProdutoRequestSchema,
} from '@foodloop/lib';
import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../shared/errors.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';

import * as service from './service.js';

const ProdutoListSchema = z.array(ProdutoSchema);

export function createProdutosRouter(): Router {
  const router = Router();

  // Público: cliente vê todos os produtos ativos sem login.
  router.get('/publicos', async (_req, res, next) => {
    try {
      const lista = await service.listarPublicos();
      res.status(200).json(ProdutoListSchema.parse(lista));
    } catch (e) {
      next(e);
    }
  });

  // Todas as outras rotas exigem comerciante autenticado.
  router.use(requireAuth, requireRole('comerciante'));

  router.get('/', async (req, res, next) => {
    try {
      const lista = await service.listarMeus(req.usuario!.id);
      res.status(200).json(ProdutoListSchema.parse(lista));
    } catch (e) {
      next(e);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const parsed = CreateProdutoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const novo = await service.criar(parsed.data, req.usuario!.id);
      res.status(201).json(ProdutoSchema.parse(novo));
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Produto não encontrado');
      }
      const parsed = UpdateProdutoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const atualizado = await service.atualizar(id, parsed.data, req.usuario!.id);
      res.status(200).json(ProdutoSchema.parse(atualizado));
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Produto não encontrado');
      }
      await service.desativar(id, req.usuario!.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return router;
}

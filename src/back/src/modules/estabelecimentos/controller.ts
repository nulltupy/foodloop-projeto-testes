import {
  CreateEstabelecimentoRequestSchema,
  ErrorCode,
  FecharEstabelecimentoRequestSchema,
  UpdateEstabelecimentoRequestSchema,
} from '@foodloop/lib';
import { Router } from 'express';

import { HttpError } from '../../shared/errors.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';

import * as avaliacoes from '../avaliacoes/service.js';

import * as service from './service.js';

export function createEstabelecimentosRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const parsed = CreateEstabelecimentoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const novo = await service.criar(req.usuario!.id, parsed.data);
      res.status(201).json(novo);
    } catch (err) {
      next(err);
    }
  });

  // Antes de '/:id' pra "me" não ser capturado como id.
  router.get('/me', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const meu = await service.getMeu(req.usuario!.id);
      if (!meu) {
        throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
      }
      res.json(meu);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/me', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const parsed = UpdateEstabelecimentoRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const atualizado = await service.atualizar(req.usuario!.id, parsed.data);
      res.json(atualizado);
    } catch (err) {
      next(err);
    }
  });

  router.post('/me/fechar', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const parsed = FecharEstabelecimentoRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido');
      }
      res.json(await service.fechar(req.usuario!.id, parsed.data.motivo));
    } catch (err) {
      next(err);
    }
  });

  router.post('/me/abrir', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      res.json(await service.abrir(req.usuario!.id));
    } catch (err) {
      next(err);
    }
  });

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

  // Avaliações do estabelecimento (perfil público), com a thread de comentários.
  router.get('/:id/avaliacoes', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      res.json(await avaliacoes.listarDoEstabelecimento(id));
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

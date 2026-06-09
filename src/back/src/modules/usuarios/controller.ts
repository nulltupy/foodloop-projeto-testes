import { ErrorCode, UpdateUsuarioRequestSchema } from '@foodloop/lib';
import { Router } from 'express';

import { HttpError } from '../../shared/errors.js';
import { requireAuth } from '../../shared/middlewares/auth.js';

import * as service from './service.js';

export function createUsuariosRouter(): Router {
  const router = Router();

  // Todas as rotas deste módulo exigem usuário autenticado.
  router.use(requireAuth);

  router.get('/me', async (req, res, next) => {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        throw new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Não autenticado');
      }
      res.status(200).json(await service.getMe(usuario.id));
    } catch (e) {
      next(e);
    }
  });

  router.patch('/me', async (req, res, next) => {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        throw new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Não autenticado');
      }
      const parsed = UpdateUsuarioRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      res.status(200).json(await service.updateMe(usuario.id, parsed.data));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

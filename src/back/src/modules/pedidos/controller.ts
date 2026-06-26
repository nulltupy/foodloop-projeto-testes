import {
  AtualizarStatusRequestSchema,
  CancelarPedidoRequestSchema,
  CriarPedidoRequestSchema,
  ErrorCode,
  StatusPedidoSchema,
} from '@foodloop/lib';
import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';
import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

const QuerySchema = z.object({
  status: StatusPedidoSchema.optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

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

  // Antes de '/:id' pra "meus"/"comerciante" não serem capturados como id.
  router.get('/meus', requireAuth, requireRole('cliente'), async (req, res, next) => {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Query inválida');
      }
      res.json(await service.listarDoCliente(req.usuario!.id, parsed.data));
    } catch (e) {
      next(e);
    }
  });

  router.get('/comerciante', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Query inválida');
      }
      res.json(await service.listarDoComerciante(req.usuario!.id, parsed.data));
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

  router.patch('/:id/status', requireAuth, requireRole('comerciante'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const parsed = AtualizarStatusRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      const atualizado = await service.avancarStatus(
        req.usuario!.id,
        id,
        parsed.data.novo_status,
        parsed.data.codigo_retirada,
      );
      res.json(atualizado);
    } catch (e) {
      next(e);
    }
  });

  // Cliente ou comerciante; a autorização específica é resolvida no service.
  router.post('/:id/cancelar', requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'ID inválido');
      }
      const parsed = CancelarPedidoRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido');
      }
      const cancelado = await service.cancelar(req.usuario!, id, parsed.data.motivo);
      res.json(cancelado);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

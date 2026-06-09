import { ErrorCode } from '@foodloop/lib';
import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../../db/client.js';
import { HttpError } from '../errors.js';
import { verifyAccessToken } from '../jwt.js';

type TipoUsuario = 'cliente' | 'comerciante';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: { id: number; nome: string; email: string; tipo: TipoUsuario };
    }
  }
}

// Lê o header Authorization: Bearer <token>, valida o JWT, busca o usuário no
// banco e popula req.usuario. Qualquer falha vira 401 TOKEN_INVALIDO, sem
// detalhar o motivo — não entregamos a um atacante se o token expirou, se a
// assinatura é inválida ou se o usuário foi removido.
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Token ausente'));
    return;
  }

  try {
    const { sub, tipo } = verifyAccessToken(header.slice('Bearer '.length));
    // Revalidar contra o banco: um token continua válido por 7 dias, mas a conta
    // pode ter sido desativada/removida nesse meio-tempo.
    const usuario = await prisma.usuario.findUnique({
      where: { id: BigInt(sub) },
      select: { id: true, nome: true, email: true, tipo: true, ativo: true },
    });
    if (!usuario || !usuario.ativo) {
      next(new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Usuário inválido'));
      return;
    }

    req.usuario = {
      id: Number(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    };
    // Sanidade: o tipo do banco deve bater com a claim do token.
    if (req.usuario.tipo !== tipo) {
      next(new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Claim de tipo divergente'));
      return;
    }
    next();
  } catch {
    next(new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Token inválido'));
  }
}

// Pressupõe requireAuth antes na cadeia. Bloqueia com 403 PERMISSAO_NEGADA se o
// tipo do usuário autenticado não estiver entre os papéis permitidos.
export function requireRole(...roles: TipoUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(new HttpError(401, ErrorCode.TOKEN_INVALIDO, 'Não autenticado'));
      return;
    }
    if (!roles.includes(req.usuario.tipo)) {
      next(new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Sem permissão para este recurso'));
      return;
    }
    next();
  };
}

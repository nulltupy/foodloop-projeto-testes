import { AuthResponseSchema, ErrorCode, LoginRequestSchema, RegisterRequestSchema } from '@foodloop/lib';
import { type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';

import { HttpError } from '../../shared/errors.js';

import * as service from './service.js';

// Sem handler customizado, o express-rate-limit responde com text/html — quebra
// clientes JSON e bypassa o errorHandler (sem requestId, sem audit log).
const rateLimitHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(429, ErrorCode.RATE_LIMIT, 'Muitas tentativas, tente novamente em instantes.'));
};

// Router-factory em vez de singleton de módulo: cada chamada de buildApp() cria
// limiters frescos, o que evita que o estado do rate-limit vaze entre testes.
// Em prod só um app existe, então o overhead é zero.
export function createAuthRouter(): Router {
  const router = Router();

  // Cap por IP em /register: limiter global (60/min) deixa muito espaço pra
  // enumeração/brute-force; aqui apertamos pra 5/min.
  const registerLimiter = rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    // /register em test não precisa exercitar o cap; já é coberto pelo /login.
    skip: () => process.env.NODE_ENV === 'test',
  });

  // /login mantém o limiter ATIVO em test: o critério de aceitação exige que
  // a 6ª tentativa em 1 min do mesmo IP receba 429.
  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

  router.post('/register', registerLimiter, async (req, res, next) => {
    try {
      const parsed = RegisterRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        // Só devolvemos os nomes dos campos que falharam — nunca os valores.
        // Frontend já tem o schema em @foodloop/lib e re-valida localmente.
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        req.log?.info(
          { event: 'auth.register.failure', reason: 'VALIDACAO', ip: req.ip, fields },
          'falha de validação no cadastro',
        );
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      let out;
      try {
        out = await service.registrar(parsed.data);
      } catch (err) {
        if (err instanceof HttpError && err.code === ErrorCode.CADASTRO_DUPLICADO) {
          req.log?.info(
            { event: 'auth.register.failure', reason: 'CADASTRO_DUPLICADO', ip: req.ip },
            'cadastro duplicado',
          );
        }
        throw err;
      }
      // Last-line-of-defense: schema parse no shape de saída garante que nunca
      // vazamos campos sensíveis (senha_hash, etc) se alguém mexer no service.
      const safe = AuthResponseSchema.parse(out);
      req.log?.info(
        {
          event: 'auth.register.success',
          usuarioId: safe.usuario.id,
          tipo: safe.usuario.tipo,
          ip: req.ip,
        },
        'usuario registrado',
      );
      res.status(201).json(safe);
    } catch (e) {
      next(e);
    }
  });

  router.post('/login', loginLimiter, async (req, res, next) => {
    try {
      const parsed = LoginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.keys(parsed.error.flatten().fieldErrors);
        req.log?.info(
          { event: 'auth.login.failure', reason: 'VALIDACAO', ip: req.ip, fields },
          'falha de validação no login',
        );
        throw new HttpError(400, ErrorCode.VALIDACAO, 'Payload inválido', { fields });
      }
      let out;
      try {
        out = await service.autenticar(parsed.data);
      } catch (err) {
        if (err instanceof HttpError && err.code === ErrorCode.CREDENCIAIS_INVALIDAS) {
          // Log NÃO diferencia "email inexistente" vs "senha errada" — mesmo se
          // o log vazar (painel, Axiom share), não revela enumeração.
          req.log?.info(
            { event: 'auth.login.failure', reason: 'CREDENCIAIS_INVALIDAS', ip: req.ip },
            'credenciais inválidas',
          );
        }
        throw err;
      }
      const safe = AuthResponseSchema.parse(out);
      req.log?.info(
        {
          event: 'auth.login.success',
          usuarioId: safe.usuario.id,
          tipo: safe.usuario.tipo,
          ip: req.ip,
        },
        'login efetuado',
      );
      res.status(200).json(safe);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

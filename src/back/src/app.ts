import { randomUUID } from 'node:crypto';

import { ErrorCode } from '@foodloop/lib';
import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { prisma } from './db/client.js';
import { createAnunciosRouter } from './modules/anuncios/controller.js';
import { createAuthRouter } from './modules/auth/controller.js';
import { createEstabelecimentosRouter } from './modules/estabelecimentos/controller.js';
import { createGeocodingRouter } from './modules/geocoding/controller.js';
import { createPedidosRouter } from './modules/pedidos/controller.js';
import { createUsuariosRouter } from './modules/usuarios/controller.js';
import { createProdutosRouter } from './modules/produtos/controller.js';
import { errorHandler, HttpError } from './shared/errors.js';
import { logger } from './shared/logger.js';
import { coldStartMiddleware } from './shared/middlewares/coldStart.js';

// Mesmo motivo do handler dentro do controller: 429 precisa ser JSON e atravessar
// o errorHandler, senão clientes recebem text/html e o log perde requestId.
const globalRateLimitHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(429, ErrorCode.RATE_LIMIT, 'Limite de requisições excedido.'));
};

export function buildApp(): Express {
  const app = express();

  // Atrás de load balancer (Render, etc.): confiar no X-Forwarded-For do primeiro
  // proxy — sem isso o express-rate-limit vê só o IP do LB e throttla todos juntos.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // HSTS forte: 1 ano + subdomínios + preload list. Em prod o domínio precisa
      // servir HTTPS em todo *.foodloop antes de habilitar isso — confirmar com infra.
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    }),
  );
  app.use(cors({ origin: process.env.FRONT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      redact: ['req.headers.authorization', 'req.body.senha', 'req.body.password'],
    }),
  );
  app.use(coldStartMiddleware);

  // /health fica antes do rate limit para uptime monitors não consumirem o budget
  // de requisições reais.
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        version: process.env.npm_package_version ?? '0.0.0',
      });
    } catch {
      res.status(503).json({ status: 'degraded' });
    }
  });

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      handler: globalRateLimitHandler,
    }),
  );

  app.use('/api/v1/auth', createAuthRouter());
  app.use('/api/v1/usuarios', createUsuariosRouter());
  app.use('/api/v1/anuncios', createAnunciosRouter());
  app.use('/api/v1/produtos', createProdutosRouter());
  app.use('/api/v1/estabelecimentos', createEstabelecimentosRouter());
  app.use('/api/v1/geocoding', createGeocodingRouter());
  app.use('/api/v1/pedidos', createPedidosRouter());

  app.use(errorHandler);

  return app;
}

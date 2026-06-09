import { randomUUID } from 'node:crypto';

import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { prisma } from './db/client.js';
import { authRouter } from './modules/auth/controller.js';
import { errorHandler } from './shared/errors.js';
import { logger } from './shared/logger.js';
import { coldStartMiddleware } from './shared/middlewares/coldStart.js';

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

  app.use(rateLimit({ windowMs: 60_000, limit: 60 }));

  app.use('/api/v1/auth', authRouter);

  app.use(errorHandler);

  return app;
}

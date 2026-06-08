import type { ErrorRequestHandler } from 'express';

import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // pino-http attaches a child logger with the request id; fall back if absent.
  (req.log ?? logger).error({ err }, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Erro interno' } });
};

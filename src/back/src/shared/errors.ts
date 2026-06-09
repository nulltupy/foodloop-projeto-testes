import { ErrorCode } from '@foodloop/lib';
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

function requestIdOf(req: { id?: unknown }): string | undefined {
  return typeof req.id === 'string' || typeof req.id === 'number' ? String(req.id) : undefined;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // pino-http attaches a child logger with the request id; fall back if absent.
  const reqLog = req.log ?? logger;
  const requestId = requestIdOf(req);

  if (err instanceof HttpError) {
    reqLog.warn({ status: err.status, code: err.code, details: err.details }, 'request error');
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details, requestId },
    });
    return;
  }

  reqLog.error({ err }, 'unhandled error');
  res.status(500).json({ error: { code: ErrorCode.INTERNO, message: 'Erro interno', requestId } });
};

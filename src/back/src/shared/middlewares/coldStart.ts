import type { NextFunction, Request, Response } from 'express';

const COLD_WINDOW_MS = 60_000;
const startedAt = Date.now();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      coldStart?: boolean;
    }
  }
}

export function coldStartMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.coldStart = Date.now() - startedAt < COLD_WINDOW_MS;
  next();
}

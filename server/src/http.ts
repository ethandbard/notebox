import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message = 'Not found') => new HttpError(404, message);
export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

// The acting user's email, injected by Cloudflare Access at the edge (the
// container has no published host port, so Access is the only path in and
// this header can't be spoofed by a direct request). Falls back to a fixed
// label for local dev, where there is no Access in front.
export function actingUser(req: Request): string {
  const header = req.header('Cf-Access-Authenticated-User-Email');
  return header && header.trim().length > 0 ? header : 'local-dev';
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', details: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

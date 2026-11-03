import type { ErrorRequestHandler } from 'express';
import { HttpException } from '../exceptions/http.exception.ts';
import { logger } from '../logger.ts';

export const exceptionMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpException) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
};

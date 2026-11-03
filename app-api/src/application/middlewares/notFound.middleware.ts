import type { RequestHandler } from 'express';
import { NotFoundException } from '../exceptions/http.exception.ts';

export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  next(new NotFoundException('Route not found'));
};

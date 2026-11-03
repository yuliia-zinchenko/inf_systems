import { Router, type ErrorRequestHandler } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { uploadsController } from './uploads.controller.ts';
import {
  imageUploadMiddleware,
  requireStorage,
  videoUploadMiddleware,
} from './storage/r2-storage.ts';
import { HttpException, ValidationException } from '../application/exceptions/http.exception.ts';
import { uploadLimiter } from '../application/middlewares/rate-limit.middleware.ts';

export const uploadsRouter = Router();

const uploadErrorHandler: ErrorRequestHandler = (err, _req, _res, next) => {
  // Errors that already carry a status (e.g. 503 from requireStorage) pass through as-is.
  if (err instanceof HttpException) {
    next(err);
    return;
  }
  if (err) {
    next(new ValidationException(err.message ?? 'Помилка завантаження'));
    return;
  }
  next();
};

uploadsRouter.post(
  '/video',
  requireAuth,
  uploadLimiter,
  requireStorage,
  videoUploadMiddleware,
  uploadErrorHandler,
  controllerWrapper(uploadsController.uploadVideo),
);

uploadsRouter.post(
  '/image',
  requireAuth,
  uploadLimiter,
  requireStorage,
  imageUploadMiddleware,
  uploadErrorHandler,
  controllerWrapper(uploadsController.uploadImage),
);

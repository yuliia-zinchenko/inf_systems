import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { videosController } from './videos.controller.ts';
import { videoCreateSchema, videoIdParamSchema, videoUpdateSchema } from './video.schema.ts';
import { checkVideoExist } from './middlewares/check-video-exist.middleware.ts';
import { checkVideoOwnership } from './middlewares/check-video-ownership.middleware.ts';

export const videosRouter = Router();

videosRouter.get('/', requireAuth, controllerWrapper(videosController.list));

videosRouter.post(
  '/',
  requireAuth,
  validate('body', videoCreateSchema),
  controllerWrapper(videosController.create),
);

// Public read so /watch and /embed work without auth.
videosRouter.get(
  '/:id',
  validate('params', videoIdParamSchema),
  checkVideoExist,
  controllerWrapper(videosController.getById),
);

videosRouter.patch(
  '/:id',
  requireAuth,
  validate('params', videoIdParamSchema),
  validate('body', videoUpdateSchema),
  checkVideoOwnership,
  controllerWrapper(videosController.update),
);

videosRouter.delete(
  '/:id',
  requireAuth,
  validate('params', videoIdParamSchema),
  checkVideoOwnership,
  controllerWrapper(videosController.remove),
);

import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { checkVideoExist } from '../videos/middlewares/check-video-exist.middleware.ts';
import { checkVideoOwnership } from '../videos/middlewares/check-video-ownership.middleware.ts';
import { analyticsController } from './analytics.controller.ts';
import {
  analyticsParamsSchema,
  analyticsRecordSchema,
} from './analytics.schema.ts';

export const analyticsRouter = Router({ mergeParams: true });

// Public ingest — anyone watching counts.
analyticsRouter.post(
  '/events',
  validate('params', analyticsParamsSchema),
  validate('body', analyticsRecordSchema),
  checkVideoExist,
  controllerWrapper(analyticsController.record),
);

// Owner-only read.
analyticsRouter.get(
  '/analytics',
  requireAuth,
  validate('params', analyticsParamsSchema),
  checkVideoOwnership,
  controllerWrapper(analyticsController.forVideo),
);

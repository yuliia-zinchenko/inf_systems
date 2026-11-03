import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { checkVideoExist } from '../videos/middlewares/check-video-exist.middleware.ts';
import { checkVideoOwnership } from '../videos/middlewares/check-video-ownership.middleware.ts';
import { productTagsController } from './product-tags.controller.ts';
import {
  productTagCreateSchema,
  productTagUpdateSchema,
  productTagParamsSchema,
  productTagIdParamsSchema,
} from './product-tag.schema.ts';

export const productTagsRouter = Router({ mergeParams: true });

// Public list so embeds/watch can render product tags without auth.
productTagsRouter.get(
  '/',
  validate('params', productTagParamsSchema),
  checkVideoExist,
  controllerWrapper(productTagsController.list),
);

productTagsRouter.post(
  '/',
  requireAuth,
  validate('params', productTagParamsSchema),
  validate('body', productTagCreateSchema),
  checkVideoOwnership,
  controllerWrapper(productTagsController.create),
);

productTagsRouter.patch(
  '/:tagId',
  requireAuth,
  validate('params', productTagIdParamsSchema),
  validate('body', productTagUpdateSchema),
  checkVideoOwnership,
  controllerWrapper(productTagsController.update),
);

productTagsRouter.delete(
  '/:tagId',
  requireAuth,
  validate('params', productTagIdParamsSchema),
  checkVideoOwnership,
  controllerWrapper(productTagsController.remove),
);

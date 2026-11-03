import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { productTagsController } from './product-tags.controller.ts';
import { scrapeProductSchema } from './product-tag.schema.ts';

/** Standalone routes that aren't scoped to a video (e.g. scrape product page metadata). */
export const productTagsScrapeRouter = Router();

productTagsScrapeRouter.post(
  '/scrape',
  requireAuth,
  validate('body', scrapeProductSchema),
  controllerWrapper(productTagsController.scrape),
);

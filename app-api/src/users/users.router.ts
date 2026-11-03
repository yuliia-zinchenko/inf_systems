import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { requireAuth } from '../application/middlewares/auth.middleware.ts';
import { usersController } from './users.controller.ts';
import { userDeleteSchema, userUpdateSchema } from './user.schema.ts';

export const usersRouter = Router();

usersRouter.patch(
  '/me',
  requireAuth,
  validate('body', userUpdateSchema),
  controllerWrapper(usersController.updateMe),
);

usersRouter.delete(
  '/me',
  requireAuth,
  validate('body', userDeleteSchema),
  controllerWrapper(usersController.deleteMe),
);

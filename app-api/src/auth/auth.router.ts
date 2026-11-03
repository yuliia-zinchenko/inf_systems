import { Router } from 'express';
import { controllerWrapper } from '../application/utils/controller-wrapper.ts';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { optionalAuth, requireAuth } from '../application/middlewares/auth.middleware.ts';
import { authController } from './auth.controller.ts';
import { authLimiter } from '../application/middlewares/rate-limit.middleware.ts';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyEmailSchema,
} from './auth.schema.ts';

export const authRouter = Router();

authRouter.get('/me', optionalAuth, controllerWrapper(authController.me));

authRouter.post(
  '/signup',
  authLimiter,
  validate('body', signupSchema),
  controllerWrapper(authController.signup),
);

authRouter.post(
  '/signin',
  authLimiter,
  validate('body', signinSchema),
  controllerWrapper(authController.signin),
);

authRouter.post(
  '/google',
  authLimiter,
  validate('body', googleSchema),
  controllerWrapper(authController.google),
);

authRouter.post(
  '/signout',
  optionalAuth,
  controllerWrapper(authController.signout),
);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate('body', forgotPasswordSchema),
  controllerWrapper(authController.forgotPassword),
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validate('body', resetPasswordSchema),
  controllerWrapper(authController.resetPassword),
);

authRouter.post(
  '/verify-email',
  authLimiter,
  validate('body', verifyEmailSchema),
  controllerWrapper(authController.verifyEmail),
);

authRouter.post(
  '/resend-verification',
  requireAuth,
  authLimiter,
  controllerWrapper(authController.resendVerification),
);

authRouter.post(
  '/change-password',
  requireAuth,
  validate('body', changePasswordSchema),
  controllerWrapper(authController.changePassword),
);

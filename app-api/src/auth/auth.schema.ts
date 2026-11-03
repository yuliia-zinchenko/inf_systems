import type { Schema } from '../application/middlewares/validation.middleware.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const signupSchema: Schema = {
  email: { type: 'string', required: true, max: 254, pattern: EMAIL_PATTERN },
  password: { type: 'string', required: true, min: 8, max: 128 },
  name: { type: 'string', required: false, max: 80 },
};

export const signinSchema: Schema = {
  email: { type: 'string', required: true, max: 254, pattern: EMAIL_PATTERN },
  password: { type: 'string', required: true, min: 1, max: 128 },
};

export const googleSchema: Schema = {
  idToken: { type: 'string', required: true, min: 10, max: 4096 },
};

export const forgotPasswordSchema: Schema = {
  email: { type: 'string', required: true, max: 254, pattern: EMAIL_PATTERN },
};

export const resetPasswordSchema: Schema = {
  token: { type: 'string', required: true, pattern: UUID_PATTERN },
  password: { type: 'string', required: true, min: 8, max: 128 },
};

export const verifyEmailSchema: Schema = {
  token: { type: 'string', required: true, pattern: UUID_PATTERN },
};

export const changePasswordSchema: Schema = {
  currentPassword: { type: 'string', required: false, max: 128 },
  newPassword: { type: 'string', required: true, min: 8, max: 128 },
};

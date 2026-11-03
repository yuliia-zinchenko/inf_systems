import type { Schema } from '../application/middlewares/validation.middleware.ts';

export const userUpdateSchema: Schema = {
  name: { type: 'string', required: false, max: 80 },
};

export const userDeleteSchema: Schema = {
  password: { type: 'string', required: false, max: 128 },
};

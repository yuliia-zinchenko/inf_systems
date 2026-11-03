import type { Schema } from '../application/middlewares/validation.middleware.ts';

const VARIANT_PATTERN = /^(card|compact|badge|minimal)$/;
const ACCENT_PATTERN = /^(fuchsia|emerald|sky|amber|rose|white)$/;

export const productTagUpdateSchema: Schema = {
  time: { type: 'number', required: false, min: 0 },
  duration: { type: 'number', required: false, min: 0.5, max: 60 },
  title: { type: 'string', required: false, min: 1, max: 200 },
  imageUrl: { type: 'string', required: false, min: 1, max: 2000 },
  link: { type: 'string', required: false, min: 1, max: 2000 },
  variant: { type: 'string', required: false, pattern: VARIANT_PATTERN },
  accentColor: { type: 'string', required: false, pattern: ACCENT_PATTERN },
  positionX: { type: 'number', required: false, min: 0, max: 100 },
  positionY: { type: 'number', required: false, min: 0, max: 100 },
};

export const productTagCreateSchema: Schema = {
  time: { type: 'number', required: true, min: 0 },
  duration: { type: 'number', required: false, min: 0.5, max: 60 },
  title: { type: 'string', required: true, min: 1, max: 200 },
  imageUrl: { type: 'string', required: true, min: 1, max: 2000 },
  link: { type: 'string', required: true, min: 1, max: 2000 },
  variant: { type: 'string', required: false, pattern: VARIANT_PATTERN },
  accentColor: { type: 'string', required: false, pattern: ACCENT_PATTERN },
  positionX: { type: 'number', required: false, min: 0, max: 100 },
  positionY: { type: 'number', required: false, min: 0, max: 100 },
};

export const scrapeProductSchema: Schema = {
  url: { type: 'string', required: true, min: 1, max: 2000 },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const productTagParamsSchema: Schema = {
  videoId: { type: 'string', required: true, pattern: UUID_PATTERN },
};

export const productTagIdParamsSchema: Schema = {
  videoId: { type: 'string', required: true, pattern: UUID_PATTERN },
  tagId: { type: 'string', required: true, pattern: UUID_PATTERN },
};

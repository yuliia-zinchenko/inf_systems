import type { Schema } from '../application/middlewares/validation.middleware.ts';

export const videoUpdateSchema: Schema = {
  title: { type: 'string', required: false, min: 1, max: 200 },
};

export const videoCreateSchema: Schema = {
  title: { type: 'string', required: true, min: 1, max: 200 },
  videoUrl: { type: 'string', required: true, min: 1, max: 2000 },
  thumbnailUrl: { type: 'string', required: false, max: 2000 },
  sourceType: { type: 'string', required: false, pattern: /^(url|upload)$/ },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const videoIdParamSchema: Schema = {
  id: { type: 'string', required: true, pattern: UUID_PATTERN },
};

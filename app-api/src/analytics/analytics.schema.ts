import type { Schema } from '../application/middlewares/validation.middleware.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const analyticsParamsSchema: Schema = {
  videoId: { type: 'string', required: true, pattern: UUID_PATTERN },
};

export const analyticsRecordSchema: Schema = {
  type: { type: 'string', required: true, pattern: /^(view|tag_click)$/ },
  tagId: { type: 'string', required: false, pattern: UUID_PATTERN },
};

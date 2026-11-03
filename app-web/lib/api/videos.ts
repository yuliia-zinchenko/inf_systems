import type { Video, VideoSourceType } from '@/types/api';
import { apiFetch } from './http';

export interface CreateVideoInput {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sourceType?: VideoSourceType;
}

export interface UpdateVideoInput {
  title?: string;
}

export const videosApi = {
  list: (): Promise<Video[]> => apiFetch('/videos'),

  get: (id: string): Promise<Video> => apiFetch(`/videos/${id}`),

  create: (input: CreateVideoInput): Promise<Video> =>
    apiFetch('/videos', { method: 'POST', json: input }),

  update: (id: string, patch: UpdateVideoInput): Promise<Video> =>
    apiFetch(`/videos/${id}`, { method: 'PATCH', json: patch }),

  remove: (id: string): Promise<void> =>
    apiFetch(`/videos/${id}`, { method: 'DELETE' }),
};

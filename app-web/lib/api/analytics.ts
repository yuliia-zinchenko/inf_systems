import type { AnalyticsEventType, VideoAnalytics } from '@/types/api';
import { apiFetch } from './http';

export const analyticsApi = {
  recordEvent: (
    videoId: string,
    type: AnalyticsEventType,
    tagId?: string,
  ): Promise<void> =>
    apiFetch(`/videos/${videoId}/events`, {
      method: 'POST',
      json: tagId ? { type, tagId } : { type },
    }),

  getForVideo: (videoId: string): Promise<VideoAnalytics> =>
    apiFetch(`/videos/${videoId}/analytics`),
};

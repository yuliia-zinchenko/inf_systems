import { createHash } from 'node:crypto';
import { analyticsRepository } from './repositories/analytics.repository.ts';
import { videoEventsTotal } from '../application/metrics.ts';
import { publish, QUEUES } from '../messaging/rabbitmq.ts';
import type {
  VideoAnalytics,
  VideoEventInput,
  VideoEventType,
} from './types/analytics.interface.ts';

const IP_HASH_SALT = process.env.ANALYTICS_IP_SALT ?? 'tagshop-default-salt';

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${IP_HASH_SALT}|${ip}`).digest('hex').slice(0, 32);
}

export const analyticsService = {
  async record(input: {
    videoId: string;
    type: VideoEventType;
    tagId: string | null;
    userAgent: string | null;
    ip: string | null;
  }): Promise<void> {
    const event: VideoEventInput = {
      videoId: input.videoId,
      type: input.type,
      tagId: input.tagId,
      userAgent: input.userAgent,
      ipHash: hashIp(input.ip),
      occurredAt: new Date().toISOString(),
    };
    // Queued for the worker; stored inline only if the broker is unavailable.
    if (!(await publish(QUEUES.analyticsEvents, event))) {
      await this.store(event);
    }
    videoEventsTotal.inc({ type: input.type });
  },

  /** Persists one event. Called by the worker for queued events. */
  store(event: VideoEventInput): Promise<void> {
    return analyticsRepository.insert(event);
  },

  forVideo(videoId: string): Promise<VideoAnalytics> {
    return analyticsRepository.forVideo(videoId);
  },
};

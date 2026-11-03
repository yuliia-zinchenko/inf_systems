import { query } from '../../database/pool.ts';
import type { VideoAnalytics, VideoEventInput } from '../types/analytics.interface.ts';

export const analyticsRepository = {
  async insert(event: VideoEventInput): Promise<void> {
    await query(
      `INSERT INTO video_events (video_id, type, tag_id, user_agent, ip_hash, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [event.videoId, event.type, event.tagId, event.userAgent, event.ipHash, event.occurredAt],
    );
  },

  async forVideo(videoId: string): Promise<VideoAnalytics> {
    const totals = await query<{ type: string; count: string }>(
      `SELECT type, COUNT(*)::text AS count
       FROM video_events
       WHERE video_id = $1
       GROUP BY type`,
      [videoId],
    );
    let views = 0;
    let totalTagClicks = 0;
    for (const row of totals.rows) {
      const n = Number(row.count);
      if (row.type === 'view') views = n;
      else if (row.type === 'tag_click') totalTagClicks = n;
    }

    const perTag = await query<{ tag_id: string; count: string }>(
      `SELECT tag_id, COUNT(*)::text AS count
       FROM video_events
       WHERE video_id = $1 AND type = 'tag_click' AND tag_id IS NOT NULL
       GROUP BY tag_id
       ORDER BY count DESC`,
      [videoId],
    );

    return {
      videoId,
      views,
      totalTagClicks,
      tagClicks: perTag.rows.map((r) => ({ tagId: r.tag_id, count: Number(r.count) })),
    };
  },
};

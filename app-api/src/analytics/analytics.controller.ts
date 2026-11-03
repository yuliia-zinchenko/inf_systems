import type { Request, Response } from 'express';
import { analyticsService } from './analytics.services.ts';
import type { VideoEventType } from './types/analytics.interface.ts';

export const analyticsController = {
  async record(
    req: Request<{ videoId: string }, unknown, { type: VideoEventType; tagId?: string }>,
    res: Response,
  ): Promise<void> {
    await analyticsService.record({
      videoId: req.params.videoId,
      type: req.body.type,
      tagId: req.body.tagId ?? null,
      userAgent: req.get('user-agent') ?? null,
      ip: (req.ip ?? null) as string | null,
    });
    res.status(204).end();
  },

  async forVideo(req: Request<{ videoId: string }>, res: Response): Promise<void> {
    const stats = await analyticsService.forVideo(req.params.videoId);
    res.status(200).json(stats);
  },
};

export type VideoEventType = 'view' | 'tag_click';

export interface VideoEventInput {
  videoId: string;
  type: VideoEventType;
  tagId: string | null;
  userAgent: string | null;
  ipHash: string | null;
  /** ISO timestamp of when the API accepted the event (it may be stored later by the worker). */
  occurredAt: string;
}

export interface VideoAnalytics {
  videoId: string;
  views: number;
  totalTagClicks: number;
  tagClicks: Array<{ tagId: string; count: number }>;
}

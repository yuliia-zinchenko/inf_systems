import type { VideoSourceType } from './video.interface.ts';

export interface VideoCreateRequestBody {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sourceType?: VideoSourceType;
}

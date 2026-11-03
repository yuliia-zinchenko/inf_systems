export type VideoSourceType = 'url' | 'upload';

export interface Video {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  sourceType: VideoSourceType;
  userId: string | null;
  createdAt: string;
}

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

export type ProductTagVariant = 'card' | 'compact' | 'badge' | 'minimal';
export type ProductTagAccent =
  | 'fuchsia'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'white';

export interface ProductTag {
  id: string;
  videoId: string;
  time: number;
  duration: number;
  title: string;
  imageUrl: string;
  link: string;
  variant: ProductTagVariant;
  accentColor: ProductTagAccent;
  /** Position in % of player container, both null = default stack at bottom-right. */
  positionX: number | null;
  positionY: number | null;
}

export interface ScrapedProduct {
  title: string | null;
  imageUrl: string | null;
}

export interface UploadImageResult {
  url: string;
  previewUrl: string;
  filename: string;
  size: number;
  mime: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: string;
}

export interface VideoAnalytics {
  videoId: string;
  views: number;
  totalTagClicks: number;
  tagClicks: ReadonlyArray<{ tagId: string; count: number }>;
}

export interface UploadResult {
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  size: number;
  mime: string;
}

export type AnalyticsEventType = 'view' | 'tag_click';

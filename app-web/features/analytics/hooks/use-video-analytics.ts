'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';

export const useVideoAnalytics = (videoId: string) =>
  useQuery({
    queryKey: queryKeys.videos.analytics(videoId),
    queryFn: () => analyticsApi.getForVideo(videoId),
    enabled: Boolean(videoId),
    retry: false,
  });

export const recordVideoEvent = analyticsApi.recordEvent;

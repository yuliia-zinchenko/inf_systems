'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ProductTag } from '@/types/api';
import { ProductTagOverlay } from './product-tag-overlay';
import { filterActiveTags } from '../lib/active-tags';

export interface InteractivePlayerHandle {
  getCurrentTime: () => number;
  pause: () => void;
  seekTo: (time: number) => void;
}

interface InteractivePlayerProps {
  videoUrl: string;
  poster?: string | null;
  tags: ProductTag[];
  onTimeUpdate?: (time: number) => void;
  onFirstPlay?: () => void;
  onTagClick?: (tag: ProductTag) => void;
  /** Fallback if a tag has no per-tag duration (legacy rows). */
  visibleDurationSec?: number;
  /** Editor mode: tags are draggable and don't navigate to merchant link. */
  editable?: boolean;
  onTagPositionChange?: (tagId: string, x: number, y: number) => void;
}

const DEFAULT_VISIBLE_DURATION_SEC = 5;

export const InteractivePlayer = forwardRef<
  InteractivePlayerHandle,
  InteractivePlayerProps
>(function InteractivePlayer(
  {
    videoUrl,
    poster,
    tags,
    onTimeUpdate,
    onFirstPlay,
    onTagClick,
    visibleDurationSec = DEFAULT_VISIBLE_DURATION_SEC,
    editable = false,
    onTagPositionChange,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const playedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    pause: () => videoRef.current?.pause(),
    seekTo: (time) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = (): void => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };
    const handlePlay = (): void => {
      if (playedRef.current) return;
      playedRef.current = true;
      onFirstPlay?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [onTimeUpdate, onFirstPlay]);

  const activeTags = filterActiveTags(tags, currentTime, visibleDurationSec);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-2xl shadow-fuchsia-500/10">
      <div className="aspect-video w-full">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster ?? undefined}
          controls
          playsInline
          className="h-full w-full"
        />
      </div>
      <ProductTagOverlay
        tags={activeTags}
        onTagClick={onTagClick}
        editable={editable}
        onPositionChange={onTagPositionChange}
      />
    </div>
  );
});

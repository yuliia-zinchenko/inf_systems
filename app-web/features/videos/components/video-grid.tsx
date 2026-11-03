'use client';

import { useState } from 'react';
import { useConfirm } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import {
  useDeleteVideo,
  useUpdateVideo,
} from '@/features/videos/hooks/use-videos';
import type { Video } from '@/types/api';
import { EmptyVideos } from './empty-videos';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
}

export const VideoGrid = ({ videos }: VideoGridProps) => {
  const toast = useToast();
  const confirm = useConfirm();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (videos.length === 0) return <EmptyVideos />;

  const handleRename = async (video: Video, title: string): Promise<void> => {
    if (title === video.title) return;
    setBusyId(video.id);
    try {
      await updateVideo.mutateAsync({ id: video.id, patch: { title } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося перейменувати');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (video: Video): Promise<void> => {
    const ok = await confirm({
      title: `Видалити «${video.title}»?`,
      description:
        'Відео, його теги та статистика будуть видалені без можливості відновлення.',
      confirmLabel: 'Видалити',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(video.id);
    try {
      await deleteVideo.mutateAsync(video.id);
      toast.success('Відео видалено');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <li key={video.id}>
          <VideoCard
            video={video}
            isBusy={busyId === video.id}
            onRename={(title) => handleRename(video, title)}
            onDelete={() => handleDelete(video)}
          />
        </li>
      ))}
    </ul>
  );
};

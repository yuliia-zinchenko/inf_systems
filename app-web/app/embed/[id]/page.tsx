'use client';

import { use } from 'react';
import { recordVideoEvent } from '@/features/analytics/hooks/use-video-analytics';
import { InteractivePlayer } from '@/features/player/components/interactive-player';
import { useProductTags } from '@/features/product-tags/hooks/use-product-tags';
import { useVideo } from '@/features/videos/hooks/use-videos';

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

const EmbedPage = ({ params }: EmbedPageProps) => {
  const { id } = use(params);
  const videoQuery = useVideo(id);
  const tagsQuery = useProductTags(id);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {videoQuery.error ? (
        <p className="p-4 text-sm text-red-300">
          {videoQuery.error instanceof Error
            ? videoQuery.error.message
            : 'Помилка завантаження'}
        </p>
      ) : !videoQuery.data ? (
        <div className="h-full w-full bg-black shimmer" />
      ) : (
        <div className="h-full max-h-full w-full">
          <InteractivePlayer
            videoUrl={videoQuery.data.videoUrl}
            poster={videoQuery.data.thumbnailUrl}
            tags={tagsQuery.data ?? []}
            onFirstPlay={() => {
              recordVideoEvent(id, 'view').catch(() => {});
            }}
            onTagClick={(tag) => {
              recordVideoEvent(id, 'tag_click', tag.id).catch(() => {});
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmbedPage;

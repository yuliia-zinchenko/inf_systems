'use client';

import Link from 'next/link';
import { use } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { recordVideoEvent } from '@/features/analytics/hooks/use-video-analytics';
import { InteractivePlayer } from '@/features/player/components/interactive-player';
import { useProductTags } from '@/features/product-tags/hooks/use-product-tags';
import { ProductGrid } from '@/features/videos/components/product-grid';
import { useVideo } from '@/features/videos/hooks/use-videos';
import { routes } from '@/lib/routes';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

const WatchPage = ({ params }: WatchPageProps) => {
  const { id } = use(params);
  const videoQuery = useVideo(id);
  const tagsQuery = useProductTags(id);

  if (videoQuery.error) {
    return (
      <PageShell width="lg">
        <GlassPanel
          variant="strong"
          className="rounded-2xl p-8 text-center"
        >
          <Alert tone="error">
            {videoQuery.error instanceof Error
              ? videoQuery.error.message
              : 'Помилка завантаження'}
          </Alert>
          <LinkButton
            href={routes.home}
            variant="ghost"
            className="mt-4 inline-flex"
          >
            На головну
          </LinkButton>
        </GlassPanel>
      </PageShell>
    );
  }

  const video = videoQuery.data;

  if (!video) {
    return (
      <PageShell width="lg">
        <Skeleton className="aspect-video" />
      </PageShell>
    );
  }

  const tags = tagsQuery.data ?? [];

  return (
    <PageShell width="lg">
      <div className="flex flex-col gap-6 animate-[var(--animate-fade-up)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="uppercase">shoppable video</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {video.title}
            </h1>
          </div>
          <Link
            href={routes.videoEdit(id)}
            className="text-sm text-muted hover:text-foreground"
          >
            Редагувати
          </Link>
        </div>
        <InteractivePlayer
          videoUrl={video.videoUrl}
          poster={video.thumbnailUrl}
          tags={tags}
          onFirstPlay={() => {
            recordVideoEvent(id, 'view').catch(() => {});
          }}
          onTagClick={(tag) => {
            recordVideoEvent(id, 'tag_click', tag.id).catch(() => {});
          }}
        />
        <ProductGrid tags={tags} />
      </div>
    </PageShell>
  );
};

export default WatchPage;

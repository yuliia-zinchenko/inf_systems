'use client';

import Link from 'next/link';
import { use, useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon } from '@/components/icons';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { useToast } from '@/components/feedback/toast';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { AnalyticsPanel } from '@/features/analytics/components/analytics-panel';
import { useVideoAnalytics } from '@/features/analytics/hooks/use-video-analytics';
import {
  InteractivePlayer,
  type InteractivePlayerHandle,
} from '@/features/player/components/interactive-player';
import { ProductTagForm } from '@/features/product-tags/components/product-tag-form';
import { ProductTagList } from '@/features/product-tags/components/product-tag-list';
import {
  useProductTags,
  useUpdateProductTag,
} from '@/features/product-tags/hooks/use-product-tags';
import { EditableTitle } from '@/features/videos/components/editable-title';
import { SharePanel } from '@/features/videos/components/share-panel';
import { useUpdateVideo, useVideo } from '@/features/videos/hooks/use-videos';
import { buildEmbedSnippet, routes } from '@/lib/routes';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

const COPY_RESET_MS = 1500;

const EditorPage = ({ params }: EditorPageProps) => {
  const { id } = use(params);
  const toast = useToast();
  const playerRef = useRef<InteractivePlayerHandle | null>(null);

  useRequireAuth(routes.videoEdit(id));

  const videoQuery = useVideo(id);
  const tagsQuery = useProductTags(id);
  const analyticsQuery = useVideoAnalytics(id);
  const updateVideo = useUpdateVideo();
  const updateTag = useUpdateProductTag(id);

  const [copied, setCopied] = useState(false);

  const handleCaptureTime = (): number => {
    const time = playerRef.current?.getCurrentTime() ?? 0;
    playerRef.current?.pause();
    return time;
  };

  const handleJumpTo = (time: number): void => {
    playerRef.current?.seekTo(time);
  };

  const handleRenameVideo = async (rawTitle: string): Promise<void> => {
    const trimmed = rawTitle.trim();
    const video = videoQuery.data;
    if (!video || !trimmed || trimmed === video.title) return;
    try {
      await updateVideo.mutateAsync({ id, patch: { title: trimmed } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка');
    }
  };

  const copyEmbedSnippet = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    const snippet = buildEmbedSnippet(window.location.origin, id);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // clipboard not available
    }
  };

  if (videoQuery.error) {
    return (
      <PageShell>
        <GlassPanel
          variant="strong"
          className="mx-auto max-w-md rounded-2xl p-8 text-center"
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
  const tags = tagsQuery.data ?? [];
  const analytics = analyticsQuery.data ?? null;

  if (!video) {
    return (
      <PageShell>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="aspect-video lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
        <div>
          <Link href={routes.home} className="text-xs text-muted hover:text-foreground">
            ← На головну
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Badge tone="uppercase">Крок 2 / 2 · редактор</Badge>
          </div>
          <EditableTitle value={video.title} onCommit={handleRenameVideo} />
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={routes.videoWatch(id)} variant="ghost">
            <EyeIcon size={14} />
            Перегляд
          </LinkButton>
          <Button onClick={copyEmbedSnippet}>
            {copied ? 'Скопійовано ✓' : 'Скопіювати embed'}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-6 lg:col-span-2">
          <InteractivePlayer
            ref={playerRef}
            videoUrl={video.videoUrl}
            tags={tags}
            editable
            onTagPositionChange={(tagId, x, y) => {
              updateTag.mutate({
                tagId,
                patch: { positionX: x, positionY: y },
              });
            }}
          />
          <p className="text-xs text-muted">
            Підказка: перемотайте до часу появи товару й перетягніть картку на
            потрібне місце на відео — позиція збережеться автоматично.
          </p>
          <ProductTagForm videoId={id} onCaptureTime={handleCaptureTime} />
        </section>

        <aside className="flex flex-col gap-6">
          <ProductTagList
            videoId={id}
            tags={tags}
            onJump={handleJumpTo}
            onCaptureTime={handleCaptureTime}
          />
          <AnalyticsPanel analytics={analytics} tags={tags} />
          <SharePanel videoId={id} />
        </aside>
      </div>
    </PageShell>
  );
};

export default EditorPage;

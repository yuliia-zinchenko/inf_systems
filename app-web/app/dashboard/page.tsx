'use client';

import { Alert } from '@/components/ui/alert';
import { LinkButton } from '@/components/ui/link-button';
import { PageShell } from '@/components/layout/page-shell';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { useMyVideos } from '@/features/videos/hooks/use-videos';
import { VideoGrid } from '@/features/videos/components/video-grid';
import { VideoGridSkeleton } from '@/features/videos/components/video-grid-skeleton';
import { routes } from '@/lib/routes';

const DashboardPage = () => {
  const { ready } = useRequireAuth(routes.dashboard);
  const myVideos = useMyVideos();

  return (
    <PageShell width="lg">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Бібліотека</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Мої <span className="gradient-text">відео</span>
          </h1>
        </div>
        <LinkButton href={routes.create} size="md">
          + Нове відео
        </LinkButton>
      </div>

      {myVideos.error && (
        <Alert tone="error" className="mt-6">
          {myVideos.error instanceof Error
            ? myVideos.error.message
            : 'Помилка завантаження'}
        </Alert>
      )}

      {!ready || myVideos.isPending ? (
        <VideoGridSkeleton />
      ) : (
        <VideoGrid videos={myVideos.data ?? []} />
      )}
    </PageShell>
  );
};

export default DashboardPage;

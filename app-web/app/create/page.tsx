'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageShell } from '@/components/layout/page-shell';
import { CreateVideoForm } from '@/features/videos/components/create-video-form';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { routes } from '@/lib/routes';

const CreatePage = () => {
  useRequireAuth(routes.create);

  return (
    <PageShell width="md" className="py-12">
      <Link
        href={routes.home}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        ← На головну
      </Link>
      <GlassPanel
        variant="strong"
        className="mt-6 rounded-3xl p-8 md:p-10 animate-[var(--animate-fade-up)]"
      >
        <Badge tone="uppercase">Крок 1 / 2</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Додай <span className="gradient-text">відео</span>
        </h1>
        <CreateVideoForm />
      </GlassPanel>
    </PageShell>
  );
};

export default CreatePage;

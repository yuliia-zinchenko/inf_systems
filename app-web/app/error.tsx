'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LinkButton } from '@/components/ui/link-button';
import { PageShell } from '@/components/layout/page-shell';
import { routes } from '@/lib/routes';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell className="grid place-items-center px-6 py-16">
      <GlassPanel
        variant="strong"
        className="w-full max-w-md rounded-3xl p-10 text-center animate-[var(--animate-fade-up)]"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/20 ring-1 ring-red-500/40 text-2xl">
          ⚠
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Щось пішло не так
        </h1>
        <p className="mt-2 break-words text-sm text-muted">
          {error.message || 'Несподівана помилка.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Спробувати знову</Button>
          <LinkButton href={routes.home} variant="ghost">
            На головну
          </LinkButton>
        </div>
      </GlassPanel>
    </PageShell>
  );
};

export default GlobalError;

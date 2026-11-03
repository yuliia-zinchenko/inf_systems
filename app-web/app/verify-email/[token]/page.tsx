'use client';

import { use, useEffect, useState } from 'react';
import { LinkButton } from '@/components/ui/link-button';
import { Spinner } from '@/components/ui/spinner';
import { GlassPanel } from '@/components/ui/glass-panel';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { useVerifyEmail } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';

type VerifyStatus = 'pending' | 'ok' | 'error';

interface VerifyEmailPageProps {
  params: Promise<{ token: string }>;
}

const VerifyEmailPage = ({ params }: VerifyEmailPageProps) => {
  const { token } = use(params);
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = useState<VerifyStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    verifyEmail
      .mutateAsync(token)
      .then(() => {
        if (!cancelled) setStatus('ok');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Не вдалося підтвердити',
        );
      });
    return () => {
      cancelled = true;
    };
    // verifyEmail mutation is stable; running once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthPageShell>
      <GlassPanel
        variant="strong"
        className="rounded-3xl p-8 md:p-10 text-center animate-[var(--animate-fade-up)]"
      >
        {status === 'pending' && <PendingState />}
        {status === 'ok' && <SuccessState />}
        {status === 'error' && <ErrorState message={errorMessage} />}
      </GlassPanel>
    </AuthPageShell>
  );
};

const PendingState = () => (
  <>
    <div className="mx-auto h-12 w-12">
      <Spinner size="lg" />
    </div>
    <p className="mt-4 text-muted">Підтверджуємо пошту…</p>
  </>
);

const SuccessState = () => (
  <>
    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-400/20 text-2xl text-emerald-300">
      ✓
    </div>
    <h1 className="mt-4 text-2xl font-semibold">Пошту підтверджено</h1>
    <p className="mt-2 text-sm text-muted">
      Дякуємо! Тепер усе готово до роботи.
    </p>
    <LinkButton href={routes.dashboard} className="mt-6 inline-flex">
      До бібліотеки
    </LinkButton>
  </>
);

const ErrorState = ({ message }: { message: string | null }) => (
  <>
    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/20 text-2xl text-red-300">
      !
    </div>
    <h1 className="mt-4 text-2xl font-semibold">Не вдалося підтвердити</h1>
    {message && <p className="mt-2 text-sm text-red-200">{message}</p>}
    <LinkButton
      href={routes.settings}
      variant="ghost"
      className="mt-6 inline-flex"
    >
      Налаштування
    </LinkButton>
  </>
);

export default VerifyEmailPage;

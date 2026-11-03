'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useResendVerification } from '@/features/auth/hooks/use-auth-mutations';

export const EmailVerificationBanner = () => {
  const resend = useResendVerification();
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async (): Promise<void> => {
    setMessage(null);
    try {
      await resend.mutateAsync();
      setMessage('Лист надіслано — перевірте пошту.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не вдалося надіслати');
    }
  };

  return (
    <section className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 animate-[var(--animate-fade-up)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-amber-200">Email не підтверджено</p>
          <p className="mt-1 text-sm text-amber-100/80">
            Перевірте вхідні листи або надішліть посилання знову.
          </p>
          {message && <p className="mt-2 text-xs text-amber-100">{message}</p>}
        </div>
        <Button variant="ghost" onClick={handleResend} disabled={resend.isPending}>
          {resend.isPending ? 'Надсилаємо…' : 'Надіслати знову'}
        </Button>
      </div>
    </section>
  );
};

'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { LinkButton } from '@/components/ui/link-button';
import { TextInput } from '@/components/ui/text-input';
import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { useForgotPassword } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати лист');
    }
  };

  return (
    <AuthPageShell>
      <AuthCard
        title={
          <>
            Скинути <span className="gradient-text">пароль</span>
          </>
        }
        subtitle={
          sent
            ? null
            : 'Введіть email — ми надішлемо посилання для скидання пароля.'
        }
      >
        {sent ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">
              Якщо акаунт із такою поштою існує, ми надіслали лист із посиланням
              для скидання пароля. Перевірте вхідні (та спам).
            </Alert>
            <LinkButton href={routes.signin()} variant="ghost" className="self-start">
              ← До входу
            </LinkButton>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Email">
                <TextInput
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              {error && <Alert tone="error">{error}</Alert>}
              <Button
                type="submit"
                disabled={forgotPassword.isPending}
                className="mt-2"
              >
                {forgotPassword.isPending ? 'Надсилаємо…' : 'Надіслати посилання'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted">
              Згадали пароль?{' '}
              <Link
                href={routes.signin()}
                className="text-fuchsia-300 hover:text-fuchsia-200"
              >
                Увійти
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;

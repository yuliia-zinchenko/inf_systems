'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { useResetPassword } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

const REDIRECT_DELAY_MS = 1500;

const ResetPasswordPage = ({ params }: ResetPasswordPageProps) => {
  const { token } = use(params);
  const router = useRouter();
  const resetPassword = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, password });
      setDone(true);
      setTimeout(() => router.push(routes.signin()), REDIRECT_DELAY_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося оновити пароль');
    }
  };

  return (
    <AuthPageShell>
      <AuthCard
        title={
          <>
            Новий <span className="gradient-text">пароль</span>
          </>
        }
        subtitle={
          done ? null : 'Придумайте новий пароль (мінімум 8 символів).'
        }
      >
        {done ? (
          <Alert tone="success">
            Пароль оновлено. Перенаправляємо на сторінку входу…
          </Alert>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Новий пароль">
                <TextInput
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <Field label="Повторіть пароль">
                <TextInput
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
              {error && <Alert tone="error">{error}</Alert>}
              <Button
                type="submit"
                disabled={resetPassword.isPending}
                className="mt-2"
              >
                {resetPassword.isPending ? 'Оновлюємо…' : 'Оновити пароль'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted">
              <Link
                href={routes.signin()}
                className="text-fuchsia-300 hover:text-fuchsia-200"
              >
                ← До входу
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthPageShell>
  );
};

export default ResetPasswordPage;

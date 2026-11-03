'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useDeleteAccount } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';
import type { User } from '@/types/api';

interface DangerZoneSectionProps {
  user: User;
}

export const DangerZoneSection = ({ user }: DangerZoneSectionProps) => {
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await deleteAccount.mutateAsync(
        user.hasPassword ? { password } : undefined,
      );
      router.replace(routes.home);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    }
  };

  const cancel = (): void => {
    setIsOpen(false);
    setPassword('');
    setError(null);
  };

  return (
    <section className="rounded-3xl border border-red-500/30 bg-red-500/5 p-8 animate-[var(--animate-fade-up)]">
      <h2 className="text-lg font-semibold text-red-200">Небезпечна зона</h2>
      <p className="mt-1 text-sm text-red-100/70">
        Видалення акаунта — незворотна дія. Усі ваші відео й товарні теги буде
        видалено.
      </p>
      {!isOpen ? (
        <Button
          variant="danger"
          size="md"
          onClick={() => setIsOpen(true)}
          className="mt-4"
        >
          Видалити акаунт
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {user.hasPassword && (
            <Field label="Введіть пароль для підтвердження">
              <TextInput
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="dangerSolid"
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? 'Видаляємо…' : 'Так, видалити назавжди'}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Скасувати
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};

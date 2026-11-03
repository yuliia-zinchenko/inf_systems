'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { GlassPanel } from '@/components/ui/glass-panel';
import { TextInput } from '@/components/ui/text-input';
import { useChangePassword } from '@/features/auth/hooks/use-auth-mutations';
import type { User } from '@/types/api';

interface ChangePasswordSectionProps {
  user: User;
}

export const ChangePasswordSection = ({ user }: ChangePasswordSectionProps) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    try {
      await changePassword.mutateAsync({
        newPassword,
        ...(user.hasPassword ? { currentPassword } : {}),
      });
      setSuccess(user.hasPassword ? 'Пароль оновлено' : 'Пароль встановлено');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося оновити пароль');
    }
  };

  return (
    <GlassPanel
      variant="strong"
      className="rounded-3xl p-8 animate-[var(--animate-fade-up)]"
    >
      <h2 className="text-lg font-semibold">
        {user.hasPassword ? 'Змінити пароль' : 'Встановити пароль'}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {user.hasPassword
          ? 'Введіть поточний пароль і новий.'
          : 'Зараз ви входите тільки через Google. Встановіть пароль, щоб мати запасний спосіб входу.'}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {user.hasPassword && (
          <Field label="Поточний пароль">
            <TextInput
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
        )}
        <Field label="Новий пароль">
          <TextInput
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        <Field label="Повторіть новий пароль">
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
        {success && <Alert tone="success">{success}</Alert>}
        <Button
          type="submit"
          disabled={changePassword.isPending}
          className="mt-2 self-start"
        >
          {changePassword.isPending ? 'Зберігаємо…' : 'Зберегти'}
        </Button>
      </form>
    </GlassPanel>
  );
};

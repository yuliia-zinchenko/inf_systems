'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { GlassPanel } from '@/components/ui/glass-panel';
import { TextInput } from '@/components/ui/text-input';
import { useUpdateProfile } from '@/features/auth/hooks/use-auth-mutations';
import type { User } from '@/types/api';

interface ProfileSectionProps {
  user: User;
}

export const ProfileSection = ({ user }: ProfileSectionProps) => {
  const updateProfile = useUpdateProfile();
  const persistedName = user.name ?? '';
  const [draftName, setDraftName] = useState<string | null>(null);
  const [storedPersistedName, setStoredPersistedName] = useState(persistedName);
  const [message, setMessage] = useState<string | null>(null);

  if (storedPersistedName !== persistedName) {
    setStoredPersistedName(persistedName);
    setDraftName(null);
  }

  const name = draftName ?? persistedName;

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setMessage(null);
    try {
      await updateProfile.mutateAsync({ name: name.trim() || null });
      setMessage('Збережено');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Помилка');
    }
  };

  const isUnchanged = name.trim() === (user.name ?? '');

  return (
    <GlassPanel
      variant="strong"
      className="rounded-3xl p-8 animate-[var(--animate-fade-up)]"
    >
      <h2 className="text-lg font-semibold">Профіль</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <Field label="Ім'я">
          <TextInput
            value={name}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Як вас називати"
            maxLength={80}
          />
        </Field>
        <div>
          <p className="text-xs text-muted">Email</p>
          <p className="mt-1 text-sm">
            {user.email}
            {user.emailVerified && (
              <span className="ml-1 text-xs text-emerald-300">✓ verified</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={user.hasPassword ? 'success' : 'muted'}>
            {user.hasPassword ? '✓ Пароль встановлено' : 'Пароль не встановлено'}
          </Badge>
          <Badge tone={user.hasGoogle ? 'success' : 'muted'}>
            {user.hasGoogle ? '✓ Google під\'єднано' : 'Google не під\'єднано'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateProfile.isPending || isUnchanged}
          >
            {updateProfile.isPending ? 'Зберігаємо…' : "Зберегти ім'я"}
          </Button>
          {message && <span className="text-xs text-muted">{message}</span>}
        </div>
      </form>
      {updateProfile.error instanceof Error && !message && (
        <Alert tone="error" className="mt-4">
          {updateProfile.error.message}
        </Alert>
      )}
    </GlassPanel>
  );
};

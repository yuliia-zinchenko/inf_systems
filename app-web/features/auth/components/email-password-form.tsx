'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { routes } from '@/lib/routes';

export interface SignInFormValues {
  email: string;
  password: string;
}

interface SignInFormProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: SignInFormValues) => void;
}

export const SignInForm = ({
  isSubmitting,
  errorMessage,
  onSubmit,
}: SignInFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
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
      <Field
        label="Пароль"
        trailing={
          <Link
            href={routes.forgotPassword}
            className="text-xs text-muted hover:text-foreground"
          >
            Забули?
          </Link>
        }
      >
        <TextInput
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Входимо…' : 'Увійти'}
      </Button>
    </form>
  );
};

export interface SignUpFormValues {
  email: string;
  password: string;
  name: string;
}

interface SignUpFormProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: SignUpFormValues) => void;
}

export const SignUpForm = ({
  isSubmitting,
  errorMessage,
  onSubmit,
}: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    onSubmit({ email, password, name });
  };

  return (
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
      <Field label="Ім'я (опційно)">
        <TextInput
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Пароль" hint="Мінімум 8 символів">
        <TextInput
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Створюємо…' : 'Створити акаунт'}
      </Button>
    </form>
  );
};

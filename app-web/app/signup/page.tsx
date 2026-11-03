'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Divider } from '@/components/ui/divider';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { GOOGLE_CLIENT_ID } from '@/lib/env';
import {
  SignUpForm,
  type SignUpFormValues,
} from '@/features/auth/components/email-password-form';
import { useNextParam } from '@/features/auth/hooks/use-next-param';
import { useSignUp } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';

const SignUpExperience = () => {
  const router = useRouter();
  const next = useNextParam();
  const signUp = useSignUp();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    email,
    password,
    name,
  }: SignUpFormValues): Promise<void> => {
    setError(null);
    try {
      const trimmedName = name.trim();
      await signUp.mutateAsync({
        email,
        password,
        ...(trimmedName ? { name: trimmedName } : {}),
      });
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Реєстрація не вдалася');
    }
  };

  return (
    <AuthCard
      title={
        <>
          Створити <span className="gradient-text">акаунт</span>
        </>
      }
      subtitle={
        <>
          Уже маєте акаунт?{' '}
          <Link
            href={routes.signin()}
            className="text-fuchsia-300 hover:text-fuchsia-200"
          >
            Увійти
          </Link>
        </>
      }
    >
      {GOOGLE_CLIENT_ID && (
        <>
          <div className="flex justify-center">
            <GoogleSignInButton
              onError={setError}
              onSuccess={() => router.push(next)}
            />
          </div>
          <Divider className="my-6">або з email</Divider>
        </>
      )}
      <SignUpForm
        isSubmitting={signUp.isPending}
        errorMessage={error}
        onSubmit={handleSubmit}
      />
    </AuthCard>
  );
};

const SignUpPage = () => (
  <AuthPageShell>
    <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
      <SignUpExperience />
    </Suspense>
  </AuthPageShell>
);

export default SignUpPage;

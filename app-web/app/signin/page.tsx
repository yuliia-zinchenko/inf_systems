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
  SignInForm,
  type SignInFormValues,
} from '@/features/auth/components/email-password-form';
import { useNextParam } from '@/features/auth/hooks/use-next-param';
import { useSignIn } from '@/features/auth/hooks/use-auth-mutations';
import { routes } from '@/lib/routes';

const SignInExperience = () => {
  const router = useRouter();
  const next = useNextParam();
  const signIn = useSignIn();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: SignInFormValues): Promise<void> => {
    setError(null);
    try {
      await signIn.mutateAsync(values);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    }
  };

  return (
    <AuthCard
      title={
        <>
          Вхід <span className="gradient-text">у TagShop</span>
        </>
      }
      subtitle={
        <>
          Ще не з нами?{' '}
          <Link
            href={routes.signup(next)}
            className="text-fuchsia-300 hover:text-fuchsia-200"
          >
            Створити акаунт
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
      <SignInForm
        isSubmitting={signIn.isPending}
        errorMessage={error}
        onSubmit={handleSubmit}
      />
    </AuthCard>
  );
};

const SignInPage = () => (
  <AuthPageShell>
    <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
      <SignInExperience />
    </Suspense>
  </AuthPageShell>
);

export default SignInPage;

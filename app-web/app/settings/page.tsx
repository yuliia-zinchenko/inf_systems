'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/features/auth/auth-context';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { ChangePasswordSection } from '@/features/auth/components/change-password-section';
import { DangerZoneSection } from '@/features/auth/components/danger-zone-section';
import { EmailVerificationBanner } from '@/features/auth/components/email-verification-banner';
import { ProfileSection } from '@/features/auth/components/profile-section';
import { routes } from '@/lib/routes';

const SettingsPage = () => {
  const { ready } = useRequireAuth(routes.settings);
  const { user } = useAuth();

  if (!ready || !user) {
    return (
      <PageShell width="md" className="py-12">
        <Skeleton className="h-96 rounded-3xl" />
      </PageShell>
    );
  }

  return (
    <PageShell width="md" className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Акаунт</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          Налаш<span className="gradient-text">тування</span>
        </h1>
      </div>

      {!user.emailVerified && <EmailVerificationBanner />}
      <ProfileSection user={user} />
      <ChangePasswordSection user={user} />
      <DangerZoneSection user={user} />
    </PageShell>
  );
};

export default SettingsPage;

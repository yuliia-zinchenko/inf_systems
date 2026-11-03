'use client';

import { LinkButton } from '@/components/ui/link-button';
import { useAuth } from '@/features/auth/auth-context';
import { routes } from '@/lib/routes';
import { BrandMark } from './brand-mark';
import { UserMenu } from './user-menu';

export const SiteHeader = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <BrandMark />
        <nav className="flex items-center gap-2">
          {loading ? (
            <span className="h-9 w-9 rounded-full bg-surface border border-border-subtle backdrop-blur-xl shimmer" />
          ) : user ? (
            <>
              <LinkButton
                href={routes.dashboard}
                variant="ghost"
                size="md"
                className="hidden sm:inline-flex"
              >
                Мої відео
              </LinkButton>
              <LinkButton href={routes.create} size="md">
                Створити
              </LinkButton>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <LinkButton href={routes.signin()} variant="ghost" size="md">
                Увійти
              </LinkButton>
              <LinkButton href={routes.signup()} size="md">
                Створити акаунт
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

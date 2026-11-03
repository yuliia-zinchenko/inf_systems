'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';
import { useAuth } from '@/features/auth/auth-context';
import type { User } from '@/types/api';

interface UserMenuProps {
  user: User;
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const { signout } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleSignout = async (): Promise<void> => {
    setIsOpen(false);
    await signout();
    router.push(routes.home);
  };

  const initial = user.name?.[0] ?? user.email[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Меню"
        className="ml-1 inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-strong border border-border-strong backdrop-blur-xl ring-1 ring-white/10 transition hover:ring-white/20"
      >
        {user.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold gradient-text">{initial}</span>
        )}
      </button>
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-64 rounded-2xl bg-surface-strong border border-border-strong backdrop-blur-xl p-3 shadow-2xl shadow-black/40',
            'animate-[var(--animate-fade-up)]',
          )}
        >
          <div className="px-2 py-2">
            <p className="text-sm font-medium truncate">
              {user.name ?? user.email}
            </p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <span className="my-2 block h-px w-full bg-white/10" />
          <Link
            href={routes.dashboard}
            onClick={() => setIsOpen(false)}
            className="block px-2 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            Мої відео
          </Link>
          <Link
            href={routes.settings}
            onClick={() => setIsOpen(false)}
            className="block px-2 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            Налаштування
          </Link>
          <button
            onClick={handleSignout}
            className="block w-full text-left px-2 py-2 rounded-lg text-sm text-red-300 hover:bg-white/5"
          >
            Вийти
          </button>
        </div>
      )}
    </div>
  );
};

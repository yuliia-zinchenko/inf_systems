'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { routes } from '@/lib/routes';
import { useAuth } from '../auth-context';

export const useRequireAuth = (currentPath: string): { ready: boolean } => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace(routes.signin(currentPath));
  }, [loading, user, router, currentPath]);

  return { ready: !loading && Boolean(user) };
};

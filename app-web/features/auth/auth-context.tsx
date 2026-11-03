'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await authApi.me();
        return response.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const setUser = useCallback(
    (user: User | null): void => {
      queryClient.setQueryData(queryKeys.currentUser, user);
    },
    [queryClient],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
  }, [queryClient]);

  const signout = useCallback(async (): Promise<void> => {
    await authApi.signout();
    setUser(null);
    await queryClient.invalidateQueries();
  }, [queryClient, setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      loading: isLoading,
      refresh,
      setUser,
      signout,
    }),
    [data, isLoading, refresh, setUser, signout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

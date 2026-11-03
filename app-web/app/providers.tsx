'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query/provider';
import { AuthProvider } from '@/features/auth/auth-context';
import { ToastProvider } from '@/components/feedback/toast';
import { ConfirmProvider } from '@/components/feedback/confirm-dialog';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => (
  <QueryProvider>
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryProvider>
);

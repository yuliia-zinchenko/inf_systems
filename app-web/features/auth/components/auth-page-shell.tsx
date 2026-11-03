import type { ReactNode } from 'react';
import { PageShell } from '@/components/layout/page-shell';

export const AuthPageShell = ({ children }: { children: ReactNode }) => (
  <PageShell width="sm" className="py-12">
    {children}
  </PageShell>
);

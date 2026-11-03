import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SiteHeader } from './site-header';

interface PageShellProps {
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const WIDTH_MAP: Record<NonNullable<PageShellProps['width']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
};

export const PageShell = ({
  children,
  width = 'xl',
  className,
}: PageShellProps) => (
  <>
    <SiteHeader />
    <main
      className={cn(
        'flex-1 mx-auto w-full px-6 py-10',
        WIDTH_MAP[width],
        className,
      )}
    >
      {children}
    </main>
  </>
);

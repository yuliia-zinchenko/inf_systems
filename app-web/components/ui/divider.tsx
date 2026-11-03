import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DividerProps {
  className?: string;
  children?: ReactNode;
}

export const Divider = ({ className, children }: DividerProps) => {
  if (!children) {
    return <span className={cn('block h-px w-full bg-white/10', className)} />;
  }
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-xs uppercase tracking-wider text-muted',
        className,
      )}
    >
      <span className="flex-1 h-px bg-white/10" />
      {children}
      <span className="flex-1 h-px bg-white/10" />
    </div>
  );
};

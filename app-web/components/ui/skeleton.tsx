import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Skeleton = ({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-2xl bg-surface border border-border-subtle backdrop-blur-xl shimmer',
      className,
    )}
    {...rest}
  />
);

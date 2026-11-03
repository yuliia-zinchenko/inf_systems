import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const Field = ({
  label,
  hint,
  trailing,
  className,
  children,
}: FieldProps) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium">{label}</span>
      {trailing}
    </span>
    {children}
    {hint && <span className="text-xs text-muted">{hint}</span>}
  </label>
);

import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const alertStyles = cva('rounded-xl px-4 py-3 text-sm border', {
  variants: {
    tone: {
      error: 'border-red-500/40 bg-red-500/10 text-red-200',
      success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
      warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
      info: 'border-border-subtle bg-surface text-foreground',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertStyles> {}

export const Alert = ({ className, tone, ...rest }: AlertProps) => (
  <div className={cn(alertStyles({ tone }), className)} {...rest} />
);

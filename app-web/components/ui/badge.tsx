import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const badgeStyles = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs',
  {
    variants: {
      tone: {
        glass: 'bg-surface border border-border-subtle text-muted',
        success:
          'bg-emerald-400/10 border border-emerald-400/20 text-emerald-200',
        muted: 'bg-surface text-muted',
        uppercase: 'bg-surface uppercase tracking-wider text-muted',
      },
    },
    defaultVariants: {
      tone: 'glass',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export const Badge = ({ className, tone, ...rest }: BadgeProps) => (
  <span className={cn(badgeStyles({ tone }), className)} {...rest} />
);

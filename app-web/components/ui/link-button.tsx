import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const linkButtonStyles = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition',
  {
    variants: {
      variant: {
        primary:
          'gradient-bg text-white font-semibold shadow-[var(--shadow-glow)] hover:-translate-y-px hover:shadow-[var(--shadow-glow-strong)]',
        ghost:
          'bg-surface border border-border-subtle text-foreground hover:bg-surface-strong hover:border-border-strong',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type LinkProps = ComponentProps<typeof Link>;

export interface LinkButtonProps
  extends LinkProps,
    VariantProps<typeof linkButtonStyles> {}

export const LinkButton = ({
  className,
  variant,
  size,
  ...rest
}: LinkButtonProps) => (
  <Link
    className={cn(linkButtonStyles({ variant, size }), className)}
    {...rest}
  />
);

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const glassStyles = cva('backdrop-blur-xl', {
  variants: {
    variant: {
      subtle: 'bg-surface border border-border-subtle',
      strong: 'bg-surface-strong border border-border-strong',
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
});

export interface GlassPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassStyles> {}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel({ className, variant, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(glassStyles({ variant }), className)} {...rest} />
    );
  },
);

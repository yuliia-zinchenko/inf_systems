import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const buttonStyles = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'gradient-bg text-white font-semibold shadow-[var(--shadow-glow)] hover:-translate-y-px hover:shadow-[var(--shadow-glow-strong)] active:translate-y-0',
        ghost:
          'bg-surface border border-border-subtle text-foreground hover:bg-surface-strong hover:border-border-strong',
        danger:
          'bg-red-500/20 border border-red-500/40 text-red-100 hover:bg-red-500/30',
        dangerSolid:
          'bg-red-500/30 border border-red-500/50 text-red-100 hover:bg-red-500/40',
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

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = 'button', ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonStyles({ variant, size }), className)}
        {...rest}
      />
    );
  },
);

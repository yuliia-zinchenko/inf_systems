import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const baseStyles =
  'bg-surface-input border border-border-subtle text-foreground placeholder:text-placeholder transition outline-none focus:border-brand-via focus:bg-surface-input-focus focus:shadow-[var(--shadow-brand)]';

export interface TextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  monospace?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, monospace, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          baseStyles,
          'rounded-xl px-4 py-2.5',
          monospace && 'font-mono text-sm',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(baseStyles, 'rounded-lg px-3 py-2 resize-none', className)}
      {...rest}
    />
  );
});

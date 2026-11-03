import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-12 w-12 border-2',
};

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <span
    className={cn(
      'inline-block rounded-full border-white/20 border-t-brand-via animate-spin',
      SIZE_MAP[size],
      className,
    )}
    aria-hidden
  />
);

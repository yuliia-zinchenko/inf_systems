import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export const ProgressBar = ({ value, className }: ProgressBarProps) => (
  <div
    className={cn(
      'h-2 overflow-hidden rounded-full bg-surface border border-border-subtle backdrop-blur-xl',
      className,
    )}
  >
    <div
      className="h-full gradient-bg transition-all"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

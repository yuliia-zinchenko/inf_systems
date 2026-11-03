import { cn } from '@/lib/cn';
import type { VideoSourceType } from '@/types/api';

interface VideoSourceToggleProps {
  value: VideoSourceType;
  onChange: (value: VideoSourceType) => void;
}

const OPTIONS: ReadonlyArray<{ value: VideoSourceType; label: string }> = [
  { value: 'url', label: 'За URL' },
  { value: 'upload', label: 'Завантажити файл' },
];

export const VideoSourceToggle = ({
  value,
  onChange,
}: VideoSourceToggleProps) => (
  <div className="inline-flex rounded-full bg-surface border border-border-subtle backdrop-blur-xl p-1 text-sm">
    {OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={cn(
          'rounded-full px-4 py-1.5 transition',
          value === option.value
            ? 'bg-white/10 text-foreground'
            : 'text-muted hover:text-foreground',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

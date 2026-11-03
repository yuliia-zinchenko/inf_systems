import type { ProductTag } from '@/types/api';

interface TimelineMarkersProps {
  tags: ProductTag[];
  duration: number;
}

export const TimelineMarkers = ({ tags, duration }: TimelineMarkersProps) => {
  if (duration <= 0 || tags.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-[40px] left-0 right-0 px-3 sm:bottom-[44px]">
      <div className="relative h-1">
        {tags.map((tag) => {
          const left = Math.min(100, (tag.time / duration) * 100);
          return (
            <span
              key={tag.id}
              title={tag.title}
              style={{ left: `${left}%` }}
              className="absolute -top-1 -translate-x-1/2 h-3 w-3 rounded-full gradient-bg ring-2 ring-black/60 shadow-lg"
            />
          );
        })}
      </div>
    </div>
  );
};

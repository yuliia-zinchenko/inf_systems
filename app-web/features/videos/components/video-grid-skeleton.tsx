import { Skeleton } from '@/components/ui/skeleton';

export const VideoGridSkeleton = () => (
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[0, 1, 2].map((index) => (
      <Skeleton key={index} className="aspect-video" />
    ))}
  </div>
);

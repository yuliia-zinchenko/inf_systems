import Link from 'next/link';
import { PlayIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

export const BrandMark = () => (
  <Link href={routes.home} className="flex items-center gap-2 group">
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-fuchsia-500/30">
      <PlayIcon size={18} />
    </span>
    <span className="font-semibold tracking-tight text-lg">
      TagShop<span className="gradient-text">.</span>Video
    </span>
  </Link>
);

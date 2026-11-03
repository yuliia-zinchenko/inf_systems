import { LinkButton } from '@/components/ui/link-button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PlayIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

export const EmptyVideos = () => (
  <GlassPanel
    variant="strong"
    className="mt-12 rounded-3xl p-10 text-center animate-[var(--animate-fade-up)]"
  >
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-bg">
      <PlayIcon size={22} />
    </div>
    <h2 className="mt-4 text-xl font-semibold">Поки що порожньо</h2>
    <p className="mt-2 text-sm text-muted">
      Створіть перше shoppable відео — це швидко.
    </p>
    <LinkButton href={routes.create} className="mt-6 inline-flex">
      Створити відео
    </LinkButton>
  </GlassPanel>
);

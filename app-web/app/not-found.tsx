import { GlassPanel } from '@/components/ui/glass-panel';
import { LinkButton } from '@/components/ui/link-button';
import { PageShell } from '@/components/layout/page-shell';
import { routes } from '@/lib/routes';

const NotFoundPage = () => (
  <PageShell className="grid place-items-center px-6 py-16">
    <GlassPanel
      variant="strong"
      className="w-full max-w-md rounded-3xl p-10 text-center animate-[var(--animate-fade-up)]"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-bg text-2xl font-bold text-white">
        404
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        Сторінку не знайдено
      </h1>
      <p className="mt-2 text-sm text-muted">
        Перевірте посилання або поверніться на головну.
      </p>
      <LinkButton href={routes.home} className="mt-6 inline-flex">
        На головну
      </LinkButton>
    </GlassPanel>
  </PageShell>
);

export default NotFoundPage;

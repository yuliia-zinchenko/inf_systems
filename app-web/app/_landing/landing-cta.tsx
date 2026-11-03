import { LinkButton } from '@/components/ui/link-button';
import { routes } from '@/lib/routes';

export const LandingCallToAction = () => (
  <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-3xl bg-surface-strong border border-border-strong backdrop-blur-xl p-10 md:flex-row md:items-center md:p-14">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Готові додати товари до свого відео?
      </h2>
      <p className="mt-2 text-muted">
        Без реєстрації. Перше інтерактивне відео — за хвилину.
      </p>
    </div>
    <LinkButton href={routes.create} size="md">
      Спробувати зараз
    </LinkButton>
  </section>
);

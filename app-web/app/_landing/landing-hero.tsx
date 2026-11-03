import { ArrowRightIcon, PlayIcon } from '@/components/icons';
import { LinkButton } from '@/components/ui/link-button';
import { routes } from '@/lib/routes';
import { LANDING_USE_CASES } from './landing-data';

export const LandingHero = () => (
  <section className="grid items-center gap-12 pt-12 md:pt-20 lg:grid-cols-12">
    <div className="flex flex-col gap-6 lg:col-span-7 animate-[var(--animate-fade-up)]">
      <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface border border-border-subtle backdrop-blur-xl px-3 py-1 text-xs uppercase tracking-wider text-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        shoppable video · нова ера контенту
      </span>
      <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
        Перетвори будь-яке відео на{' '}
        <span className="gradient-text">магазин</span>
      </h1>
      <p className="max-w-xl text-lg text-muted md:text-xl">
        TagShop Video — це інтерактивний редактор, що дозволяє прив&apos;язати
        товари до моментів у відео. Глядач бачить картку, клікає, купує.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <LinkButton href={routes.create} size="lg">
          Створити відео
          <ArrowRightIcon size={16} />
        </LinkButton>
        <a
          href="#how"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-surface border border-border-subtle backdrop-blur-xl px-5 py-2.5 text-sm font-medium transition hover:bg-surface-strong hover:border-border-strong"
        >
          Як це працює
        </a>
      </div>
      <ul className="flex flex-wrap gap-2 pt-4">
        {LANDING_USE_CASES.map((useCase) => (
          <li
            key={useCase}
            className="rounded-full bg-surface border border-border-subtle backdrop-blur-xl px-3 py-1 text-xs text-muted"
          >
            {useCase}
          </li>
        ))}
      </ul>
    </div>

    <div className="relative lg:col-span-5">
      <HeroMockup />
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/30 to-orange-400/30 opacity-60 blur-3xl" />
    </div>
  </section>
);

const HeroMockup = () => (
  <div className="relative overflow-hidden rounded-3xl bg-surface-strong border border-border-strong backdrop-blur-xl p-3 shadow-2xl shadow-fuchsia-500/10">
  <div 
      className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-hero.png')" }}   
    >     
  <div className="absolute inset-0 grid place-items-center opacity-95">
        <PlayIcon size={80} />
      </div>
      <MockTagBadge top="1rem" right="1rem" title="Кросівки Air-Z" />
      <MockTagBadge
        bottom="4rem"
        left="1rem"
        title="Толстовка Glow"
        delayMs={150}
      />
      <div className="absolute inset-x-3 bottom-3 h-2 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/3 gradient-bg" />
      </div>
    </div>
  </div>
);

interface MockTagBadgeProps {
  title: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  delayMs?: number;
}

const MockTagBadge = ({
  title,
  top,
  right,
  bottom,
  left,
  delayMs,
}: MockTagBadgeProps) => (
  <div
    className="absolute flex items-center gap-2 rounded-xl bg-black/50 px-3 py-2 backdrop-blur animate-[var(--animate-fade-up)]"
    style={{
      top,
      right,
      bottom,
      left,
      ...(delayMs ? { animationDelay: `${delayMs}ms` } : {}),
    }}
  >
    <div className="h-10 w-10 rounded-lg bg-white/90" />
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-white">{title}</span>
      <span className="text-[10px] text-fuchsia-300">Перейти →</span>
    </div>
  </div>
);

import { LANDING_FEATURES } from './landing-data';

export const LandingFeatures = () => (
  <section id="how" className="pt-28">
    <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
      Все, щоб <span className="gradient-text">контент продавав</span>
    </h2>
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {LANDING_FEATURES.map((feature) => (
        <article
          key={feature.title}
          className="flex flex-col gap-3 rounded-2xl bg-surface border border-border-subtle backdrop-blur-xl p-6 transition hover:border-border-strong"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl gradient-bg text-white">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold">{feature.title}</h3>
          <p className="text-sm leading-relaxed text-muted">{feature.text}</p>
        </article>
      ))}
    </div>
  </section>
);

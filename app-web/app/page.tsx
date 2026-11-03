import { PageShell } from '@/components/layout/page-shell';
import { LandingCallToAction } from './_landing/landing-cta';
import { LandingFeatures } from './_landing/landing-features';
import { LandingHero } from './_landing/landing-hero';

const HomePage = () => (
  <PageShell className="pb-24 px-6">
    <LandingHero />
    <LandingFeatures />
    <LandingCallToAction />
  </PageShell>
);

export default HomePage;

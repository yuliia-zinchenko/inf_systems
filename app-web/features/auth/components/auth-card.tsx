import type { ReactNode } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';

interface AuthCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthCard = ({ title, subtitle, children, footer }: AuthCardProps) => (
  <GlassPanel
    variant="strong"
    className="rounded-3xl p-8 md:p-10 animate-[var(--animate-fade-up)]"
  >
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    {subtitle && <div className="mt-2 text-sm text-muted">{subtitle}</div>}
    <div className="mt-6">{children}</div>
    {footer && <div className="mt-4 text-sm text-muted">{footer}</div>}
  </GlassPanel>
);

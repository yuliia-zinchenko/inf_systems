import type { ProductTag, VideoAnalytics } from '@/types/api';

interface AnalyticsPanelProps {
  analytics: VideoAnalytics | null;
  tags: ProductTag[];
}

export const AnalyticsPanel = ({ analytics, tags }: AnalyticsPanelProps) => (
  <div className="flex flex-col gap-3 rounded-2xl bg-surface-strong border border-border-strong backdrop-blur-xl p-6">
    <h2 className="font-semibold">Статистика</h2>
    {!analytics ? (
      <p className="text-sm text-muted">Поки немає даних.</p>
    ) : (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Перегляди" value={analytics.views} />
          <Stat label="Кліки по тегах" value={analytics.totalTagClicks} />
        </div>
        {analytics.tagClicks.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...analytics.tagClicks]
              .sort((a, b) => b.count - a.count)
              .map((row) => {
                const tag = tags.find((item) => item.id === row.tagId);
                return (
                  <li
                    key={row.tagId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-muted">
                      {tag?.title ?? 'Видалений тег'}
                    </span>
                    <span className="font-mono text-fuchsia-300">
                      {row.count}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </>
    )}
  </div>
);

interface StatProps {
  label: string;
  value: number;
}

const Stat = ({ label, value }: StatProps) => (
  <div className="rounded-xl bg-surface border border-border-subtle backdrop-blur-xl p-3">
    <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
    <p className="mt-1 text-2xl font-semibold">{value}</p>
  </div>
);

import type { ProductTag } from '@/types/api';

interface ProductGridProps {
  tags: ProductTag[];
}

export const ProductGrid = ({ tags }: ProductGridProps) => {
  if (tags.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted">
        Усі товари у відео
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <li key={tag.id}>
            <ProductCard tag={tag} />
          </li>
        ))}
      </ul>
    </section>
  );
};

const ProductCard = ({ tag }: { tag: ProductTag }) => (
  <a
    href={tag.link}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-2xl bg-surface border border-border-subtle backdrop-blur-xl p-3 transition hover:border-border-strong"
  >
    {tag.imageUrl ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={tag.imageUrl}
        alt={tag.title}
        className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10"
      />
    ) : (
      <div className="h-14 w-14 rounded-xl gradient-bg" />
    )}
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{tag.title}</p>
      <p className="text-xs text-fuchsia-300">Перейти →</p>
    </div>
  </a>
);

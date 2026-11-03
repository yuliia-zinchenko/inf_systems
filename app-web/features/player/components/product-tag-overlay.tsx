'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { ProductTag } from '@/types/api';
import { ACCENT_CLASSES } from '@/features/product-tags/lib/styles';

interface ProductTagOverlayProps {
  tags: ProductTag[];
  onTagClick?: (tag: ProductTag) => void;
  /** Editor mode: tags are draggable, click-through to merchant link disabled. */
  editable?: boolean;
  onPositionChange?: (tagId: string, positionX: number, positionY: number) => void;
}

export const ProductTagOverlay = ({
  tags,
  onTagClick,
  editable = false,
  onPositionChange,
}: ProductTagOverlayProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tags WITHOUT explicit position fall back to the legacy bottom-right stack.
  const positioned = tags.filter((t) => t.positionX !== null && t.positionY !== null);
  const stacked = tags.filter((t) => t.positionX === null || t.positionY === null);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {positioned.map((tag) => (
        <DraggableTag
          key={tag.id}
          tag={tag}
          editable={editable}
          containerRef={containerRef}
          onTagClick={onTagClick}
          onPositionChange={onPositionChange}
        />
      ))}

      {stacked.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-end justify-end gap-2 p-4 sm:p-5">
          {stacked.map((tag) => (
            <DraggableTag
              key={tag.id}
              tag={tag}
              editable={editable}
              containerRef={containerRef}
              onTagClick={onTagClick}
              onPositionChange={onPositionChange}
              stacked
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DraggableTagProps {
  tag: ProductTag;
  editable: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onTagClick?: (tag: ProductTag) => void;
  onPositionChange?: (tagId: string, x: number, y: number) => void;
  /** Render inline inside the bottom-right stack (no absolute positioning). */
  stacked?: boolean;
}

const DraggableTag = ({
  tag,
  editable,
  containerRef,
  onTagClick,
  onPositionChange,
  stacked = false,
}: DraggableTagProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const draggable = editable;

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!draggable) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      x: tag.positionX ?? 50,
      y: tag.positionY ?? 80,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!draggable || !dragStateRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    dragStateRef.current = { x, y, moved: true };
    setLocalPos({ x, y });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!draggable) return;
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    const state = dragStateRef.current;
    dragStateRef.current = null;
    setIsDragging(false);
    setLocalPos(null);
    if (state?.moved) {
      onPositionChange?.(tag.id, state.x, state.y);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    if (editable) {
      event.preventDefault();
      return;
    }
    onTagClick?.(tag);
  };

  // Compute the wrapper position. Local drag state wins, then saved position,
  // else inline (the parent .stack handles flex layout).
  const displayX = localPos?.x ?? tag.positionX;
  const displayY = localPos?.y ?? tag.positionY;
  const useAbsolute = !stacked || localPos !== null;

  const wrapperStyle =
    useAbsolute && displayX !== null && displayY !== null
      ? {
          position: 'absolute' as const,
          left: `${displayX}%`,
          top: `${displayY}%`,
          transform: 'translate(-50%, -50%)',
        }
      : undefined;

  const dragClass = isDragging
    ? 'cursor-grabbing scale-105'
    : draggable
      ? 'cursor-grab'
      : '';

  const interactionProps = {
    onClick: handleClick,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return (
    <div style={wrapperStyle}>
      <TagBody
        tag={tag}
        editable={editable}
        extraClassName={`pointer-events-auto ${dragClass}`}
        interactionProps={interactionProps}
      />
    </div>
  );
};

interface TagBodyProps {
  tag: ProductTag;
  editable: boolean;
  extraClassName: string;
  interactionProps: Record<string, unknown>;
}

const TagBody = ({ tag, editable, extraClassName, interactionProps }: TagBodyProps) => {
  const accent = ACCENT_CLASSES[tag.accentColor] ?? ACCENT_CLASSES.fuchsia;
  // In editor we render <div> (no navigation). In viewer it's an <a>.
  const Wrapper = (editable ? 'div' : 'a') as 'a';
  const wrapperProps = editable
    ? {}
    : { href: tag.link, target: '_blank', rel: 'noopener noreferrer' };

  switch (tag.variant) {
    case 'badge':
      return (
        <Wrapper
          {...wrapperProps}
          {...interactionProps}
          className={`group block animate-[var(--animate-fade-up)] transition ${extraClassName}`}
          title={tag.title}
        >
          <div
            className={`h-14 w-14 overflow-hidden rounded-full ring-2 ${accent.ring} bg-black/60 backdrop-blur-md shadow-xl`}
          >
            {tag.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={tag.imageUrl} alt={tag.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-bg" />
            )}
          </div>
        </Wrapper>
      );

    case 'minimal':
      return (
        <Wrapper
          {...wrapperProps}
          {...interactionProps}
          className={`group inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 ring-1 ${accent.ring} backdrop-blur-md shadow-xl animate-[var(--animate-fade-up)] transition hover:bg-black/85 ${extraClassName}`}
        >
          <span className={`text-xs font-semibold ${accent.text}`}>›</span>
          <span className="text-xs font-medium text-white">{tag.title}</span>
        </Wrapper>
      );

    case 'compact':
      return (
        <Wrapper
          {...wrapperProps}
          {...interactionProps}
          className={`group flex max-w-[200px] items-center gap-2 rounded-xl bg-black/65 px-2 py-1.5 ring-1 ${accent.ring} backdrop-blur-md shadow-xl animate-[var(--animate-fade-up)] transition hover:bg-black/80 ${extraClassName}`}
        >
          {tag.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tag.imageUrl} alt={tag.title} className="h-9 w-9 rounded-md object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-md gradient-bg" />
          )}
          <span className="truncate text-xs font-semibold text-white">{tag.title}</span>
        </Wrapper>
      );

    case 'card':
    default:
      return (
        <Wrapper
          {...wrapperProps}
          {...interactionProps}
          className={`group flex w-[280px] flex-shrink-0 items-center gap-3 rounded-2xl bg-black/60 px-3 py-2 pr-4 ring-1 ${accent.ring} backdrop-blur-md shadow-xl animate-[var(--animate-fade-up)] transition hover:bg-black/75 ${extraClassName}`}
        >
          {tag.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tag.imageUrl}
              alt={tag.title}
              className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg gradient-bg" />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-white line-clamp-2">{tag.title}</span>
            <span className={`text-[11px] font-medium ${accent.text} ${accent.hoverText}`}>
              Перейти →
            </span>
          </div>
        </Wrapper>
      );
  }
};

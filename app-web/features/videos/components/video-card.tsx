'use client';

import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LinkButton } from '@/components/ui/link-button';
import { TextInput } from '@/components/ui/text-input';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { formatDateUk } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { Video } from '@/types/api';

interface VideoCardProps {
  video: Video;
  isBusy: boolean;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => void;
}

export const VideoCard = ({ video, isBusy, onRename, onDelete }: VideoCardProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(video.title);

  const startRename = (): void => {
    setDraftTitle(video.title);
    setIsRenaming(true);
  };

  const commitRename = async (): Promise<void> => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    await onRename(trimmed);
    setIsRenaming(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') void commitRename();
    if (event.key === 'Escape') setIsRenaming(false);
  };

  return (
    <GlassPanel
      variant="strong"
      className="group flex flex-col overflow-hidden rounded-2xl transition hover:ring-1 hover:ring-white/15"
    >
      <Link href={routes.videoEdit(video.id)} className="block">
        <div className="relative aspect-video bg-black/40">
          {video.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={video.videoUrl}
              className="h-full w-full object-cover"
              preload="metadata"
              muted
            />
          )}
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full bg-surface-strong border border-border-strong backdrop-blur-xl px-4 py-1.5 text-xs font-medium">
              Редагувати →
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {isRenaming ? (
          <div className="flex flex-col gap-2">
            <TextInput
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
              className="rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => void commitRename()}
                disabled={isBusy}
                className="flex-1 justify-center"
              >
                Зберегти
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsRenaming(false)}
                disabled={isBusy}
              >
                Скасувати
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="truncate font-medium">{video.title}</p>
            <p className="mt-1 text-xs text-muted">
              {formatDateUk(video.createdAt)} ·{' '}
              {video.sourceType === 'upload' ? 'файл' : 'URL'}
            </p>
          </>
        )}
      </div>

      {!isRenaming && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          <LinkButton
            href={routes.videoWatch(video.id)}
            variant="ghost"
            size="sm"
            className="flex-1 justify-center"
          >
            Перегляд
          </LinkButton>
          <Button
            variant="ghost"
            size="sm"
            onClick={startRename}
            title="Перейменувати"
          >
            <PencilIcon size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={onDelete}
            title="Видалити"
            className="hover:text-red-300"
          >
            <TrashIcon size={14} />
          </Button>
        </div>
      )}
    </GlassPanel>
  );
};

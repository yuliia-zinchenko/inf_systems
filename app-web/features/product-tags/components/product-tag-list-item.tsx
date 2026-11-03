'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { formatTimecode } from '@/lib/format';
import type { ProductTag, ProductTagAccent, ProductTagVariant } from '@/types/api';
import type { UpdateProductTagInput } from '@/lib/api/product-tags';
import { AccentPicker, VariantPicker } from './style-pickers';

interface ProductTagListItemProps {
  tag: ProductTag;
  onJump: (time: number) => void;
  onCaptureTime: () => number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: UpdateProductTagInput) => Promise<void>;
}

export const ProductTagListItem = ({
  tag,
  onJump,
  onCaptureTime,
  onDelete,
  onUpdate,
}: ProductTagListItemProps) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditMode
        tag={tag}
        onCaptureTime={onCaptureTime}
        onCancel={() => setIsEditing(false)}
        onSave={async (patch) => {
          await onUpdate(tag.id, patch);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-xl bg-surface border border-border-subtle backdrop-blur-xl p-2.5 transition hover:border-border-strong">
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
      <button
        onClick={() => onJump(tag.time)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium">{tag.title}</p>
        <p className="text-xs text-muted">@ {formatTimecode(tag.time)}</p>
      </button>
      <button
        onClick={() => setIsEditing(true)}
        title="Редагувати"
        className="rounded-lg p-1.5 opacity-50 transition hover:bg-white/5 hover:text-fuchsia-300 group-hover:opacity-100"
      >
        <PencilIcon size={14} />
      </button>
      <button
        onClick={() => onDelete(tag.id)}
        title="Видалити"
        className="rounded-lg p-1.5 opacity-50 transition hover:bg-white/5 hover:text-red-400 group-hover:opacity-100"
      >
        <TrashIcon size={14} />
      </button>
    </li>
  );
};

interface EditModeProps {
  tag: ProductTag;
  onCaptureTime: () => number;
  onSave: (patch: UpdateProductTagInput) => Promise<void>;
  onCancel: () => void;
}

const EditMode = ({ tag, onCaptureTime, onSave, onCancel }: EditModeProps) => {
  const [title, setTitle] = useState(tag.title);
  const [imageUrl, setImageUrl] = useState(tag.imageUrl);
  const [link, setLink] = useState(tag.link);
  const [time, setTime] = useState(tag.time);
  const [duration, setDuration] = useState(tag.duration ?? 5);
  const [variant, setVariant] = useState<ProductTagVariant>(tag.variant ?? 'card');
  const [accentColor, setAccentColor] = useState<ProductTagAccent>(
    tag.accentColor ?? 'fuchsia',
  );
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setIsBusy(true);
    setError(null);
    try {
      await onSave({ title, imageUrl, link, time, duration, variant, accentColor });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
      setIsBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-surface border border-border-subtle backdrop-blur-xl p-3">
      <TextInput
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Назва"
        className="rounded-lg px-3 py-1.5 text-sm"
      />
      <TextInput
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        placeholder="URL зображення"
        monospace
        className="rounded-lg px-3 py-1.5 text-xs"
      />
      <TextInput
        value={link}
        onChange={(event) => setLink(event.target.value)}
        placeholder="Посилання покупки"
        monospace
        className="rounded-lg px-3 py-1.5 text-xs"
      />
      <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
        <VariantPicker value={variant} onChange={setVariant} />
        <AccentPicker value={accentColor} onChange={setAccentColor} />
      </div>
      <div className="flex items-center gap-2">
        <TextInput
          type="number"
          min={0}
          step="0.01"
          value={time}
          onChange={(event) => setTime(Number(event.target.value))}
          monospace
          className="w-20 rounded-lg px-2 py-1.5 text-xs"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setTime(Number(onCaptureTime().toFixed(2)))}
          title="Взяти з відео"
        >
          ⌖
        </Button>
        <TextInput
          type="number"
          min={0.5}
          max={60}
          step="0.5"
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
          monospace
          title="Тривалість показу (сек)"
          className="w-20 rounded-lg px-2 py-1.5 text-xs"
        />
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={isBusy}>
          {isBusy ? '…' : 'Зберегти'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isBusy}>
          ✕
        </Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </li>
  );
};

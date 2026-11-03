'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ClockIcon } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useCreateProductTag } from '@/features/product-tags/hooks/use-product-tags';
import { useToast } from '@/components/feedback/toast';
import { productTagsApi, uploadsApi } from '@/lib/api';
import type { ProductTagAccent, ProductTagVariant } from '@/types/api';
import { VariantPicker, AccentPicker } from './style-pickers';

interface ProductTagFormProps {
  videoId: string;
  onCaptureTime: () => number;
}

const DEFAULT_DURATION_SEC = 5;

export const ProductTagForm = ({ videoId, onCaptureTime }: ProductTagFormProps) => {
  const toast = useToast();
  const createTag = useCreateProductTag(videoId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // Local preview when the user picked a file but hasn't submitted yet.
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(DEFAULT_DURATION_SEC);
  const [variant, setVariant] = useState<ProductTagVariant>('card');
  const [accentColor, setAccentColor] = useState<ProductTagAccent>('fuchsia');
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = (): void => {
    setLink('');
    setTitle('');
    setImageUrl('');
    setImagePreview(null);
    setImageFile(null);
    setTime(0);
    setDuration(DEFAULT_DURATION_SEC);
    setVariant('card');
    setAccentColor('fuchsia');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScrape = async (): Promise<void> => {
    if (!link.trim()) {
      setError('Спершу вкажіть посилання на товар');
      return;
    }
    setError(null);
    setIsScraping(true);
    try {
      const data = await productTagsApi.scrape(link.trim());
      if (data.title) setTitle(data.title);
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setImagePreview(data.imageUrl);
        setImageFile(null);
      }
      if (!data.title && !data.imageUrl) {
        toast.info('Не вдалось дістати інфо — заповніть вручну');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалось завантажити інфо');
    } finally {
      setIsScraping(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);
    setImageUrl('');
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploaded = await uploadsApi.uploadImage({ file: imageFile });
        finalImageUrl = uploaded.url; // storage key — backend will sign on read
      }
      if (!finalImageUrl) {
        setError('Додайте зображення товару (з посилання або файл)');
        return;
      }
      await createTag.mutateAsync({
        title,
        imageUrl: finalImageUrl,
        link,
        time,
        duration,
        variant,
        accentColor,
      });
      toast.success('Товар додано');
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const captureTime = (): void => {
    setTime(Number(onCaptureTime().toFixed(2)));
  };

  const isSubmitting = createTag.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-surface-strong border border-border-strong backdrop-blur-xl p-6 animate-[var(--animate-fade-up)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Додати товар</h2>
      </div>

      <Field label="Посилання на товар">
        <div className="flex gap-2">
          <TextInput
            required
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://shop.example.com/product/..."
            monospace
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={handleScrape}
            disabled={isScraping || !link.trim()}
          >
            {isScraping ? 'Шукаємо…' : 'Завантажити інфо'}
          </Button>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          {imagePreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imagePreview}
              alt="Прев'ю товару"
              className="h-24 w-24 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-border-subtle text-xs text-muted">
              Немає
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Завантажити фото
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Назва товару">
            <TextInput
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Кросівки Air-Z"
            />
          </Field>
          <Field label="Або URL зображення">
            <TextInput
              type="url"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                setImagePreview(event.target.value || null);
                setImageFile(null);
              }}
              placeholder="https://..."
              monospace
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 border-t border-white/5 pt-3 sm:grid-cols-2">
        <Field label="Стиль картки">
          <VariantPicker value={variant} onChange={setVariant} />
        </Field>
        <Field label="Колір акценту">
          <AccentPicker value={accentColor} onChange={setAccentColor} />
        </Field>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-white/5 pt-3">
        <Field label="Час (сек)">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            value={time}
            onChange={(event) => setTime(Number(event.target.value))}
            monospace
            className="w-28 rounded-xl px-3 py-2"
          />
        </Field>
        <Button type="button" variant="ghost" onClick={captureTime}>
          <ClockIcon size={14} />
          Взяти з відео
        </Button>
        <Field label="Тривалість (сек)">
          <TextInput
            type="number"
            min={0.5}
            max={60}
            step="0.5"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            monospace
            className="w-28 rounded-xl px-3 py-2"
          />
        </Field>
        <div className="flex-1" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Додаємо…' : 'Додати товар'}
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
    </form>
  );
};

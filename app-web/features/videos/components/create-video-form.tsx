'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spinner } from '@/components/ui/spinner';
import { TextInput } from '@/components/ui/text-input';
import { routes } from '@/lib/routes';
import type { VideoSourceType } from '@/types/api';
import {
  useCreateVideo,
  useUploadVideoFile,
} from '@/features/videos/hooks/use-videos';
import { VideoFileDropzone } from './video-file-dropzone';
import { VideoSourceToggle } from './video-source-toggle';

interface UploadResolution {
  url: string;
  thumbnailUrl: string | null;
}

const stripExtension = (filename: string): string =>
  filename.replace(/\.[^.]+$/, '');

export const CreateVideoForm = () => {
  const router = useRouter();
  const createVideo = useCreateVideo();
  const uploadVideo = useUploadVideoFile();

  const [mode, setMode] = useState<VideoSourceType>('url');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedThumb, setUploadedThumb] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickFile = (next: File | null): void => {
    setError(null);
    setUploadedUrl(null);
    setUploadedThumb(null);
    setUploadPercent(null);
    setFile(next);
    if (next && !title) setTitle(stripExtension(next.name));
  };

  const resolveSource = async (): Promise<UploadResolution> => {
    if (mode === 'url') return { url: videoUrl, thumbnailUrl: null };
    if (!file) throw new Error('Виберіть файл');
    if (uploadedUrl) return { url: uploadedUrl, thumbnailUrl: uploadedThumb };
    setUploadPercent(0);
    const result = await uploadVideo.mutateAsync({
      file,
      onProgress: (percent) => setUploadPercent(percent),
    });
    setUploadedUrl(result.url);
    setUploadedThumb(result.thumbnailUrl);
    return { url: result.url, thumbnailUrl: result.thumbnailUrl };
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { url, thumbnailUrl } = await resolveSource();
      const created = await createVideo.mutateAsync({
        title,
        videoUrl: url,
        sourceType: mode,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      });
      router.push(routes.videoEdit(created.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
      setIsSubmitting(false);
    }
  };

  const isDisabled =
    isSubmitting || !title || (mode === 'url' ? !videoUrl : !file);

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
      <VideoSourceToggle value={mode} onChange={setMode} />
      <Field label="Назва">
        <TextInput
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Огляд літньої колекції"
          className="rounded-xl px-4 py-3 text-base"
        />
      </Field>

      {mode === 'url' ? (
        <Field
          label="URL відео"
          hint="Пряме посилання на .mp4 / .webm / .ogg"
        >
          <TextInput
            required
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://example.com/video.mp4"
            monospace
            className="rounded-xl px-4 py-3 text-base"
          />
        </Field>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Файл відео</span>
          <VideoFileDropzone file={file} onPick={pickFile} />
          {uploadPercent !== null && <ProgressBar value={uploadPercent} />}
          {uploadedUrl && (
            <p className="text-xs text-emerald-300">✓ Завантажено</p>
          )}
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <Button
        type="submit"
        disabled={isDisabled}
        className="mt-2 self-start"
        size="md"
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            {uploadPercent !== null && uploadPercent < 100
              ? `Завантаження ${uploadPercent}%`
              : 'Створюємо…'}
          </>
        ) : (
          <>
            Перейти до редактора
            <ArrowRightIcon size={16} />
          </>
        )}
      </Button>
    </form>
  );
};

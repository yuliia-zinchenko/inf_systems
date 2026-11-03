'use client';

import { useRef, type DragEvent } from 'react';
import { UploadIcon } from '@/components/icons';
import { formatBytesAsMB } from '@/lib/format';

interface VideoFileDropzoneProps {
  file: File | null;
  onPick: (file: File | null) => void;
}

const ACCEPTED_FORMATS =
  'video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska';

export const VideoFileDropzone = ({
  file,
  onPick,
}: VideoFileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) onPick(dropped);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-2xl bg-surface border border-dashed border-white/15 backdrop-blur-xl px-6 py-10 text-center transition hover:border-fuchsia-400/40"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="hidden"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <div>
          <p className="truncate font-medium">{file.name}</p>
          <p className="mt-1 text-xs text-muted">
            {formatBytesAsMB(file.size)} · {file.type || 'video'}
          </p>
        </div>
      ) : (
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl gradient-bg">
            <UploadIcon size={20} />
          </div>
          <p className="mt-3 text-sm">
            <span className="text-fuchsia-300">Натисніть, щоб обрати</span> або
            перетягніть файл сюди
          </p>
          <p className="mt-1 text-xs text-muted">
            До 200 MB · MP4, WebM, OGG, MOV, MKV
          </p>
        </div>
      )}
    </div>
  );
};

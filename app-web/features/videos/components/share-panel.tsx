'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/text-input';
import { buildEmbedSnippet, routes } from '@/lib/routes';

interface SharePanelProps {
  videoId: string;
}

const COPY_RESET_MS = 1500;

export const SharePanel = ({ videoId }: SharePanelProps) => {
  const [copied, setCopied] = useState(false);
  const watchUrl = routes.videoWatch(videoId);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedSnippet = buildEmbedSnippet(origin, videoId);

  const copyEmbed = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-strong border border-border-strong backdrop-blur-xl p-6">
      <h2 className="font-semibold">Поділитися</h2>
      <p className="text-xs text-muted">Посилання для перегляду</p>
      <code className="break-all rounded-lg bg-surface border border-border-subtle backdrop-blur-xl px-3 py-2 font-mono text-xs">
        {watchUrl}
      </code>
      <p className="mt-2 text-xs text-muted">Embed-код для сайту</p>
      <TextArea
        readOnly
        rows={3}
        value={embedSnippet}
        onClick={(event) => (event.target as HTMLTextAreaElement).select()}
        className="font-mono text-xs"
      />
      <Button variant="ghost" size="md" onClick={copyEmbed} className="self-start">
        {copied ? 'Скопійовано ✓' : 'Копіювати embed'}
      </Button>
    </div>
  );
};

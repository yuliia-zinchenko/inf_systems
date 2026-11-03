'use client';

import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/lib/env';
import { useGoogleSignIn } from '../hooks/use-auth-mutations';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    el: HTMLElement,
    options: Record<string, string | number | boolean>,
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

const loadGsiScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GIS_SRC}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google script')),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
};

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  onSuccess?: () => void;
}

export const GoogleSignInButton = ({
  onError,
  onSuccess,
}: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const googleSignIn = useGoogleSignIn();
  const [isBusy, setBusy] = useState(false);

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId || !containerRef.current) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setBusy(true);
            try {
              await googleSignIn.mutateAsync(credential);
              onSuccess?.();
            } catch (err) {
              onError?.(
                err instanceof Error ? err.message : 'Google sign-in failed',
              );
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: 320,
        });
      })
      .catch((err) =>
        onError?.(err instanceof Error ? err.message : 'Помилка Google'),
      );

    return () => {
      cancelled = true;
    };
  }, [googleSignIn, onError, onSuccess]);

  // Not configured: render nothing rather than a setup hint to end users.
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={isBusy ? 'opacity-50 pointer-events-none' : undefined}
      />
      {isBusy && <span className="text-xs text-muted">Входимо…</span>}
    </div>
  );
};

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (value: boolean): void => {
      setPending((current) => {
        if (current) current.resolve(value);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close(false);
      if (event.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pending, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <ConfirmDialog
          confirmBtnRef={confirmBtnRef}
          options={pending}
          onClose={close}
        />
      )}
    </ConfirmContext.Provider>
  );
};

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onClose: (value: boolean) => void;
  confirmBtnRef: React.RefObject<HTMLButtonElement | null>;
}

const ConfirmDialog = ({ options, onClose, confirmBtnRef }: ConfirmDialogProps) => {
  const isDanger = options.tone === 'danger';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[9998] grid place-items-center p-4 bg-black/60 backdrop-blur-sm animate-[var(--animate-fade-up)]"
      onClick={() => onClose(false)}
    >
      <GlassPanel
        variant="strong"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <h2 id="confirm-title" className="text-lg font-semibold">
          {options.title}
        </h2>
        {options.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {options.description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={() => onClose(false)}>
            {options.cancelLabel ?? 'Скасувати'}
          </Button>
          <Button
            ref={confirmBtnRef}
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            onClick={() => onClose(true)}
          >
            {options.confirmLabel ?? 'Підтвердити'}
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
};

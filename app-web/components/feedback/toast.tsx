'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  text: string;
}

interface ToastContextValue {
  show: (text: string, tone?: ToastTone) => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  error: 'border-red-400/40 bg-red-500/15 text-red-100',
  info: 'border-white/15 bg-white/8 text-foreground',
};

const TONE_GLYPH: Record<ToastTone, string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

const TOAST_TIMEOUT_MS = 4000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number): void => {
    setItems((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (text: string, tone: ToastTone = 'info'): void => {
      idRef.current += 1;
      const id = idRef.current;
      setItems((prev) => [...prev, { id, tone, text }]);
      setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (text) => show(text, 'success'),
      error: (text) => show(text, 'error'),
      info: (text) => show(text, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex max-w-sm flex-col gap-2">
        {items.map((toast) => (
          <ToastNotification
            key={toast.id}
            item={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastNotificationProps {
  item: ToastItem;
  onDismiss: () => void;
}

const ToastNotification = ({ item, onDismiss }: ToastNotificationProps) => (
  <div
    role="status"
    className={cn(
      'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md shadow-xl animate-[var(--animate-fade-up)]',
      TONE_STYLES[item.tone],
    )}
  >
    <span
      aria-hidden
      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-bold"
    >
      {TONE_GLYPH[item.tone]}
    </span>
    <p className="flex-1 text-sm leading-snug">{item.text}</p>
    <button
      onClick={onDismiss}
      aria-label="Закрити"
      className="text-xs opacity-60 transition hover:opacity-100"
    >
      ✕
    </button>
  </div>
);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

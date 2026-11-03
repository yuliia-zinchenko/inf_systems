'use client';

import type { ProductTagAccent, ProductTagVariant } from '@/types/api';
import { ACCENT_OPTIONS, VARIANT_OPTIONS } from '../lib/styles';

interface VariantPickerProps {
  value: ProductTagVariant;
  onChange: (next: ProductTagVariant) => void;
}

export const VariantPicker = ({ value, onChange }: VariantPickerProps) => (
  <div className="flex flex-wrap gap-2">
    {VARIANT_OPTIONS.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.hint}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            active
              ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-foreground'
              : 'border-border-subtle bg-surface text-muted hover:border-border-strong hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

interface AccentPickerProps {
  value: ProductTagAccent;
  onChange: (next: ProductTagAccent) => void;
}

export const AccentPicker = ({ value, onChange }: AccentPickerProps) => (
  <div className="flex flex-wrap gap-2">
    {ACCENT_OPTIONS.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.label}
          aria-label={opt.label}
          className={`h-7 w-7 rounded-full ring-2 transition ${opt.swatch} ${
            active ? 'ring-foreground scale-110' : 'ring-transparent hover:ring-white/30'
          }`}
        />
      );
    })}
  </div>
);

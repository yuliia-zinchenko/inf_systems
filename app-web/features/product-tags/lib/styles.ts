import type { ProductTagAccent, ProductTagVariant } from '@/types/api';

// Tailwind needs static class strings to survive purging — keep these as literal maps,
// don't compose class names dynamically.

export const ACCENT_OPTIONS: ReadonlyArray<{
  value: ProductTagAccent;
  label: string;
  /** dot/swatch color for the picker */
  swatch: string;
}> = [
  { value: 'fuchsia', label: 'Фуксія', swatch: 'bg-fuchsia-500' },
  { value: 'emerald', label: 'Смарагд', swatch: 'bg-emerald-500' },
  { value: 'sky', label: 'Небесний', swatch: 'bg-sky-500' },
  { value: 'amber', label: 'Бурштин', swatch: 'bg-amber-500' },
  { value: 'rose', label: 'Троянда', swatch: 'bg-rose-500' },
  { value: 'white', label: 'Білий', swatch: 'bg-white' },
];

export const VARIANT_OPTIONS: ReadonlyArray<{
  value: ProductTagVariant;
  label: string;
  hint: string;
}> = [
  { value: 'card', label: 'Картка', hint: 'фото + назва + кнопка' },
  { value: 'compact', label: 'Компактна', hint: 'маленька, фото + назва' },
  { value: 'badge', label: 'Бейдж', hint: 'тільки фото-кружок' },
  { value: 'minimal', label: 'Мінімал', hint: 'текстова пігулка' },
];

interface AccentClasses {
  ring: string;
  text: string;
  hoverText: string;
  ctaBg: string;
  ctaHoverBg: string;
}

export const ACCENT_CLASSES: Record<ProductTagAccent, AccentClasses> = {
  fuchsia: {
    ring: 'ring-fuchsia-400/40',
    text: 'text-fuchsia-300',
    hoverText: 'group-hover:text-fuchsia-200',
    ctaBg: 'bg-fuchsia-500/90',
    ctaHoverBg: 'hover:bg-fuchsia-400',
  },
  emerald: {
    ring: 'ring-emerald-400/40',
    text: 'text-emerald-300',
    hoverText: 'group-hover:text-emerald-200',
    ctaBg: 'bg-emerald-500/90',
    ctaHoverBg: 'hover:bg-emerald-400',
  },
  sky: {
    ring: 'ring-sky-400/40',
    text: 'text-sky-300',
    hoverText: 'group-hover:text-sky-200',
    ctaBg: 'bg-sky-500/90',
    ctaHoverBg: 'hover:bg-sky-400',
  },
  amber: {
    ring: 'ring-amber-400/40',
    text: 'text-amber-300',
    hoverText: 'group-hover:text-amber-200',
    ctaBg: 'bg-amber-500/90',
    ctaHoverBg: 'hover:bg-amber-400',
  },
  rose: {
    ring: 'ring-rose-400/40',
    text: 'text-rose-300',
    hoverText: 'group-hover:text-rose-200',
    ctaBg: 'bg-rose-500/90',
    ctaHoverBg: 'hover:bg-rose-400',
  },
  white: {
    ring: 'ring-white/40',
    text: 'text-white',
    hoverText: 'group-hover:text-white',
    ctaBg: 'bg-white/90',
    ctaHoverBg: 'hover:bg-white',
  },
};

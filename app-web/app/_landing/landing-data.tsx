import { CartIcon, CodeIcon, TagIcon } from '@/components/icons';
import type { ReactNode } from 'react';

export interface LandingFeature {
  title: string;
  text: string;
  icon: ReactNode;
}

export const LANDING_FEATURES: ReadonlyArray<LandingFeature> = [
  {
    title: 'Тегуй у потоці',
    text: 'Додавай товари прямо під час перегляду — ми зафіксуємо таймкод одним кліком.',
    icon: <TagIcon size={22} />,
  },
  {
    title: 'Embed де завгодно',
    text: 'Готовий iframe для будь-якого сайту. Без хедерів, без зайвого — лише плеєр.',
    icon: <CodeIcon size={22} />,
  },
  {
    title: 'Купуй у кадрі',
    text: 'Картка товару з\'являється в потрібний момент — глядач переходить на сторінку покупки.',
    icon: <CartIcon size={22} />,
  },
];

export const LANDING_USE_CASES: ReadonlyArray<string> = [
  'Інтернет-магазини',
  'Маркетингові кампанії',
  'Блогери та оглядачі',
  'Презентації продуктів',
  'Освітні відео',
];

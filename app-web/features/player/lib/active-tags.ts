import type { ProductTag } from '@/types/api';

/**
 * Множина активних тегів A(τ) = { Tᵢ : tᵢ ≤ τ ≤ tᵢ + dᵢ }.
 * Якщо у тегу немає власної тривалості dᵢ, береться fallbackDurationSec.
 *
 * Винесено в окремий модуль, щоб алгоритм можна було протестувати
 * без рендеру React-компонента — див. розділ 3.7 курсової.
 */
export const filterActiveTags = <T extends Pick<ProductTag, 'time' | 'duration'>>(
  tags: T[],
  currentTime: number,
  fallbackDurationSec: number,
): T[] =>
  tags.filter((tag) => {
    const dur = tag.duration && tag.duration > 0 ? tag.duration : fallbackDurationSec;
    return currentTime >= tag.time && currentTime <= tag.time + dur;
  });

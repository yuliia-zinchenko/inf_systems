'use client';

import { useEffect, type RefObject } from 'react';

export const useClickOutside = <TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  onOutside: () => void,
  active = true,
): void => {
  useEffect(() => {
    if (!active) return;
    const handler = (event: MouseEvent): void => {
      const target = event.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) {
        onOutside();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside, active]);
};

'use client';

import { useSearchParams } from 'next/navigation';

export const useNextParam = (fallback = '/dashboard'): string => {
  const params = useSearchParams();
  return params.get('next') ?? fallback;
};

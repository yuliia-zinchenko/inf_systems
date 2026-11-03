export const queryKeys = {
  currentUser: ['auth', 'me'] as const,
  videos: {
    all: ['videos'] as const,
    detail: (id: string) => ['video', id] as const,
    productTags: (videoId: string) => ['video', videoId, 'product-tags'] as const,
    analytics: (videoId: string) => ['video', videoId, 'analytics'] as const,
  },
} as const;

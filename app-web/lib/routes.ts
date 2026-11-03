export const routes = {
  home: '/',
  signin: (next?: string): string =>
    next && next !== '/dashboard'
      ? `/signin?next=${encodeURIComponent(next)}`
      : '/signin',
  signup: (next?: string): string =>
    next && next !== '/dashboard'
      ? `/signup?next=${encodeURIComponent(next)}`
      : '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  settings: '/settings',
  create: '/create',
  videoEdit: (id: string): string => `/videos/${id}/edit`,
  videoWatch: (id: string): string => `/watch/${id}`,
  videoEmbed: (id: string): string => `/embed/${id}`,
} as const;

export const buildEmbedSnippet = (origin: string, videoId: string): string =>
  `<iframe src="${origin}/embed/${videoId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

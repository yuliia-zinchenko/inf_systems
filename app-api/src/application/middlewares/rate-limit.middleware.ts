import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

/** Tight limiter for sensitive auth endpoints — protects against brute force / spam. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 10 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато спроб. Спробуйте за кілька хвилин.' },
});

/** Loose limiter for upload — heavy operation, but legitimate users may do several. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 30 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Перевищено ліміт завантажень. Спробуйте пізніше.' },
});

/** Global fallback to absorb obvious abuse. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProd ? 240 : 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

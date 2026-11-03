import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { videosRouter } from '../videos/videos.router.ts';
import { productTagsRouter } from '../product-tags/product-tags.router.ts';
import { productTagsScrapeRouter } from '../product-tags/product-tags-scrape.router.ts';
import { authRouter } from '../auth/auth.router.ts';
import { usersRouter } from '../users/users.router.ts';
import { analyticsRouter } from '../analytics/analytics.router.ts';
import { uploadsRouter } from '../uploads/uploads.router.ts';
import { optionalAuth } from './middlewares/auth.middleware.ts';
import { notFoundMiddleware } from './middlewares/notFound.middleware.ts';
import { exceptionMiddleware } from './middlewares/exception.middleware.ts';
import { globalLimiter } from './middlewares/rate-limit.middleware.ts';
import { httpMetrics } from './metrics.ts';
import { httpLogger } from './logger.ts';

export const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  }),
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(httpMetrics);
app.use(httpLogger);

app.use(globalLimiter);

// Make req.user available to all downstream handlers (no enforcement here).
app.use(optionalAuth);

const API_PREFIX = '/api';
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/uploads`, uploadsRouter);
app.use(`${API_PREFIX}/videos`, videosRouter);
app.use(`${API_PREFIX}/product-tags`, productTagsScrapeRouter);
app.use(`${API_PREFIX}/videos/:videoId/product-tags`, productTagsRouter);
app.use(`${API_PREFIX}/videos/:videoId`, analyticsRouter);

app.use(notFoundMiddleware);
app.use(exceptionMiddleware);

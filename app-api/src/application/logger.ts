import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

/**
 * Structured JSON logs on stdout. Grafana Alloy collects container stdout and
 * ships it to Loki, where `level` becomes a label and the rest stays queryable
 * with `| json`.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: process.env.OTEL_SERVICE_NAME ?? 'tagshop-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

const SILENT_PATHS = new Set(['/healthz', '/metrics']);

/** One access-log line per request. Headers are not logged: they carry the session cookie. */
export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,
  autoLogging: { ignore: (req) => SILENT_PATHS.has((req.url ?? '').split('?')[0] ?? '') },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${(req as Request).originalUrl} ${res.statusCode} ${Math.round(responseTime)}ms`,
  customErrorMessage: (req, res) => `${req.method} ${(req as Request).originalUrl} ${res.statusCode} failed`,
  customProps: (req) => {
    const user = (req as Request).user;
    return user ? { userId: user.id } : {};
  },
  serializers: {
    req: (req: { method: string; url: string; headers: Record<string, string | undefined> }) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});

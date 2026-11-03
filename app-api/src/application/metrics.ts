import http from 'node:http';
import type { Request, RequestHandler } from 'express';
import client from 'prom-client';
import { logger } from './logger.ts';

/** Single registry scraped by Prometheus via GET /metrics. */
export const register = new client.Registry();
register.setDefaultLabels({ service: process.env.OTEL_SERVICE_NAME ?? 'tagshop-api' });
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'PostgreSQL query latency in seconds',
  labelNames: ['operation', 'status'] as const,
  buckets: [0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const videoEventsTotal = new client.Counter({
  name: 'tagshop_video_events_total',
  help: 'Recorded video analytics events',
  labelNames: ['type'] as const,
  registers: [register],
});

export const authAttemptsTotal = new client.Counter({
  name: 'tagshop_auth_attempts_total',
  help: 'Authentication attempts by action and outcome',
  labelNames: ['action', 'result'] as const,
  registers: [register],
});

export const uploadsTotal = new client.Counter({
  name: 'tagshop_uploads_total',
  help: 'Files uploaded to object storage',
  labelNames: ['kind'] as const,
  registers: [register],
});

export const uploadBytesTotal = new client.Counter({
  name: 'tagshop_upload_bytes_total',
  help: 'Bytes uploaded to object storage',
  labelNames: ['kind'] as const,
  registers: [register],
});

export const messagesPublishedTotal = new client.Counter({
  name: 'tagshop_messages_published_total',
  help: 'Messages handed to RabbitMQ (published) or processed inline because the broker was unavailable (fallback)',
  labelNames: ['queue', 'result'] as const,
  registers: [register],
});

export const workerMessagesTotal = new client.Counter({
  name: 'tagshop_worker_messages_total',
  help: 'Messages consumed by the worker by outcome',
  labelNames: ['queue', 'result'] as const,
  registers: [register],
});

export const workerProcessingDuration = new client.Histogram({
  name: 'tagshop_worker_processing_seconds',
  help: 'Time to process one queued message',
  labelNames: ['queue'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Route label with ids collapsed (/api/videos/:id) to keep cardinality bounded.
 * Requests that matched no route (scanners, typos) share one label.
 */
function routeLabel(req: Request): string {
  if (!req.route) return 'unmatched';
  const path = req.originalUrl.split('?')[0] ?? '';
  return path.replace(UUID_RE, ':id');
}

export const httpMetrics: RequestHandler = (req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: routeLabel(req), status_code: String(res.statusCode) });
  });
  next();
};

/**
 * Serves GET /metrics on a separate, internal-only port so the scrape endpoint
 * is reachable by Prometheus inside the Docker network but not through the
 * public API port.
 */
export function startMetricsServer(port: number): void {
  http
    .createServer((req, res) => {
      if (req.url === '/metrics') {
        register
          .metrics()
          .then((body) => {
            res.setHeader('Content-Type', register.contentType);
            res.end(body);
          })
          .catch(() => {
            res.statusCode = 500;
            res.end();
          });
        return;
      }
      res.statusCode = req.url === '/healthz' ? 200 : 404;
      res.end();
    })
    .listen(port, () => logger.info({ port }, 'Metrics server listening'));
}

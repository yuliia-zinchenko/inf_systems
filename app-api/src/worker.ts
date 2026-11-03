/**
 * Queue worker: consumes RabbitMQ queues filled by the API.
 *   analytics.events → INSERT into video_events
 *   email.send       → SMTP (or log in dev)
 * Failed messages are rejected without requeue and land in <queue>.dlq.
 *
 * Runs from the same image as the API:
 *   node --import ./src/instrumentation.ts src/worker.ts
 */
import 'dotenv/config';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from './application/logger.ts';
import {
  startMetricsServer,
  workerMessagesTotal,
  workerProcessingDuration,
} from './application/metrics.ts';
import { analyticsService } from './analytics/analytics.services.ts';
import type { VideoEventInput } from './analytics/types/analytics.interface.ts';
import { emailService, type EmailMessage } from './email/email.services.ts';
import {
  messagingEnabled,
  QUEUES,
  startMessaging,
  type QueueName,
} from './messaging/rabbitmq.ts';

const PREFETCH = Number(process.env.WORKER_PREFETCH ?? 20);
const METRICS_PORT = Number(process.env.WORKER_METRICS_PORT ?? 9100);

const handlers: Record<QueueName, (payload: unknown) => Promise<void>> = {
  [QUEUES.analyticsEvents]: (payload) => analyticsService.store(payload as VideoEventInput),
  [QUEUES.emailSend]: (payload) => emailService.send(payload as EmailMessage),
};

async function processMessage(
  ch: ConfirmChannel,
  queue: QueueName,
  msg: ConsumeMessage,
): Promise<void> {
  const end = workerProcessingDuration.startTimer({ queue });
  try {
    await handlers[queue](JSON.parse(msg.content.toString()));
    ch.ack(msg);
    workerMessagesTotal.inc({ queue, result: 'ok' });
  } catch (err) {
    // No requeue: a poison message would loop forever; keep it in the DLQ instead.
    ch.nack(msg, false, false);
    workerMessagesTotal.inc({ queue, result: 'dead_lettered' });
    logger.error({ err, queue }, 'Message processing failed, sent to DLQ');
  } finally {
    end();
  }
}

async function consume(ch: ConfirmChannel): Promise<void> {
  await ch.prefetch(PREFETCH);
  for (const queue of Object.values(QUEUES)) {
    await ch.consume(queue, (msg) => {
      if (msg) void processMessage(ch, queue, msg);
    });
  }
  logger.info({ queues: Object.values(QUEUES), prefetch: PREFETCH }, 'Worker consuming');
}

if (!messagingEnabled) {
  logger.fatal('RABBITMQ_URL is required for the worker');
  process.exit(1);
}

startMessaging(consume);

startMetricsServer(METRICS_PORT);

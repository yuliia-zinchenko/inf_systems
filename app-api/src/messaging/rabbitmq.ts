import amqp, { type ConfirmChannel } from 'amqplib';
import { logger } from '../application/logger.ts';
import { messagesPublishedTotal } from '../application/metrics.ts';

/**
 * RabbitMQ topology:
 *   exchange `tagshop` (direct) ──<queue name>──► analytics.events | email.send
 *   rejected messages ──► exchange `tagshop.dlx` ──► <queue>.dlq
 *
 * Without RABBITMQ_URL (plain local dev) messaging is disabled and callers fall
 * back to processing inline, so the API never depends on the broker to work.
 */
export const EXCHANGE = 'tagshop';
const DEAD_LETTER_EXCHANGE = 'tagshop.dlx';

export const QUEUES = {
  analyticsEvents: 'analytics.events',
  emailSend: 'email.send',
} as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RECONNECT_DELAY_MS = 5000;

export const messagingEnabled = Boolean(RABBITMQ_URL);

let channel: ConfirmChannel | null = null;
let onConnected: ((ch: ConfirmChannel) => Promise<void>) | null = null;

async function assertTopology(ch: ConfirmChannel): Promise<void> {
  await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
  await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', { durable: true });
  for (const queue of Object.values(QUEUES)) {
    await ch.assertQueue(`${queue}.dlq`, { durable: true });
    await ch.bindQueue(`${queue}.dlq`, DEAD_LETTER_EXCHANGE, queue);
    await ch.assertQueue(queue, {
      durable: true,
      deadLetterExchange: DEAD_LETTER_EXCHANGE,
      deadLetterRoutingKey: queue,
    });
    await ch.bindQueue(queue, EXCHANGE, queue);
  }
}

function scheduleReconnect(): void {
  setTimeout(() => void connect(), RECONNECT_DELAY_MS);
}

async function connect(): Promise<void> {
  try {
    const connection = await amqp.connect(RABBITMQ_URL!);
    connection.on('error', (err) => logger.error({ err }, 'RabbitMQ connection error'));
    connection.on('close', () => {
      channel = null;
      logger.warn('RabbitMQ connection closed, reconnecting');
      scheduleReconnect();
    });
    const ch = await connection.createConfirmChannel();
    await assertTopology(ch);
    channel = ch;
    logger.info('RabbitMQ connected');
    if (onConnected) await onConnected(ch);
  } catch (err) {
    logger.warn({ err }, `RabbitMQ unavailable, retrying in ${RECONNECT_DELAY_MS} ms`);
    scheduleReconnect();
  }
}

/**
 * Starts the (re)connection loop. `connected` runs after every successful
 * connect — the worker uses it to (re)register its consumers.
 */
export function startMessaging(connected?: (ch: ConfirmChannel) => Promise<void>): void {
  if (!messagingEnabled) {
    logger.warn('RABBITMQ_URL not set — messaging disabled, processing inline');
    return;
  }
  onConnected = connected ?? null;
  void connect();
}

/**
 * Publishes a persistent JSON message and waits for the broker confirm.
 * Returns false when the broker is unavailable so the caller can fall back.
 */
export async function publish(queue: QueueName, payload: unknown): Promise<boolean> {
  const ch = channel;
  if (!ch) {
    messagesPublishedTotal.inc({ queue, result: 'fallback' });
    return false;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      ch.publish(
        EXCHANGE,
        queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, contentType: 'application/json' },
        (err) => (err ? reject(err) : resolve()),
      );
    });
    messagesPublishedTotal.inc({ queue, result: 'published' });
    return true;
  } catch (err) {
    logger.error({ err, queue }, 'RabbitMQ publish failed, processing inline');
    messagesPublishedTotal.inc({ queue, result: 'fallback' });
    return false;
  }
}

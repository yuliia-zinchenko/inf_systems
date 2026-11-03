import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '../application/logger.ts';
import { publish, QUEUES } from '../messaging/rabbitmq.ts';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let cachedTransporter: Transporter | null = null;
let warned = false;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) {
    if (!warned) {
      logger.warn('SMTP_* env vars not configured — emails will be logged only');
      warned = true;
    }
    return null;
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export const emailService = {
  /**
   * Hands the message to the worker via RabbitMQ so the HTTP request does not
   * wait for SMTP; sends inline only if the broker is unavailable.
   */
  async enqueue(message: EmailMessage): Promise<void> {
    if (!(await publish(QUEUES.emailSend, message))) {
      await this.send(message);
    }
  },

  async send(message: EmailMessage): Promise<void> {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM ?? 'TagShop Video <no-reply@tagshop.local>';
    if (!transporter) {
      // Dev fallback: the full text (with verify/reset links) is searchable in Loki.
      logger.info(
        { email: { to: message.to, subject: message.subject, text: message.text } },
        'Email (dev, not sent)',
      );
      return;
    }
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
  },
};

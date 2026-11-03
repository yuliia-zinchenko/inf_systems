import 'dotenv/config';
import { app } from './application/app.ts';
import { runMigrations } from './database/migrate.ts';
import { logger } from './application/logger.ts';
import { startMessaging } from './messaging/rabbitmq.ts';
import { startMetricsServer } from './application/metrics.ts';

const PORT = Number(process.env.PORT ?? 4000);
const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9464);

async function bootstrap(): Promise<void> {
  await runMigrations();
  startMessaging();
  startMetricsServer(METRICS_PORT);
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `API listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});

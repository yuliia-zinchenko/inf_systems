import pg from 'pg';
import client from 'prom-client';
import { dbQueryDuration, register } from '../application/metrics.ts';
import { logger } from '../application/logger.ts';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://tagshop:tagshop@localhost:5433/tagshop';

export const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected Postgres pool error');
});

new client.Gauge({
  name: 'db_pool_connections',
  help: 'Postgres pool connections by state',
  labelNames: ['state'] as const,
  registers: [register],
  collect() {
    this.set({ state: 'total' }, pool.totalCount);
    this.set({ state: 'idle' }, pool.idleCount);
    this.set({ state: 'waiting' }, pool.waitingCount);
  },
});

const KNOWN_OPERATIONS = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH']);

function operationOf(text: string): string {
  const keyword = /^\s*(\w+)/.exec(text)?.[1]?.toUpperCase();
  return keyword && KNOWN_OPERATIONS.has(keyword) ? keyword : 'OTHER';
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>,
): Promise<pg.QueryResult<T>> {
  const end = dbQueryDuration.startTimer({ operation: operationOf(text) });
  try {
    const result = await pool.query<T>(text, params as unknown[] | undefined);
    end({ status: 'ok' });
    return result;
  } catch (err) {
    end({ status: 'error' });
    throw err;
  }
}

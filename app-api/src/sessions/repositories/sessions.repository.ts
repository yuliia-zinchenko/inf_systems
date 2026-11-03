import { query } from '../../database/pool.ts';
import type { Session } from '../types/session.interface.ts';

interface SessionRow {
  id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

export const sessionsRepository = {
  async create(input: {
    userId: string;
    expiresAt: Date;
    userAgent: string | null;
    ip: string | null;
  }): Promise<Session> {
    const { rows } = await query<SessionRow>(
      `INSERT INTO sessions (user_id, expires_at, user_agent, ip)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, created_at, expires_at`,
      [input.userId, input.expiresAt, input.userAgent, input.ip],
    );
    return toSession(rows[0]!);
  },

  async findValid(id: string): Promise<Session | undefined> {
    const { rows } = await query<SessionRow>(
      `SELECT id, user_id, created_at, expires_at
       FROM sessions
       WHERE id = $1 AND expires_at > NOW()`,
      [id],
    );
    const row = rows[0];
    return row ? toSession(row) : undefined;
  },

  async delete(id: string): Promise<void> {
    await query(`DELETE FROM sessions WHERE id = $1`, [id]);
  },
};

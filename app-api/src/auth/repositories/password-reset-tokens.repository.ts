import { query } from '../../database/pool.ts';

interface PasswordResetTokenRow {
  token: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
}

function toToken(row: PasswordResetTokenRow): PasswordResetToken {
  return {
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at.toISOString(),
    usedAt: row.used_at?.toISOString() ?? null,
  };
}

export const passwordResetTokensRepository = {
  async create(userId: string, expiresAt: Date): Promise<PasswordResetToken> {
    const { rows } = await query<PasswordResetTokenRow>(
      `INSERT INTO password_reset_tokens (user_id, expires_at)
       VALUES ($1, $2)
       RETURNING token, user_id, expires_at, used_at`,
      [userId, expiresAt],
    );
    return toToken(rows[0]!);
  },

  async findActive(token: string): Promise<PasswordResetToken | undefined> {
    const { rows } = await query<PasswordResetTokenRow>(
      `SELECT token, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token],
    );
    const row = rows[0];
    return row ? toToken(row) : undefined;
  },

  async markUsed(token: string): Promise<void> {
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
      [token],
    );
  },
};

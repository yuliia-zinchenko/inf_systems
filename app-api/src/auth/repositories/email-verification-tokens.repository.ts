import { query } from '../../database/pool.ts';

interface EmailVerificationTokenRow {
  token: string;
  user_id: string;
  email: string;
  expires_at: Date;
  used_at: Date | null;
}

export interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
}

function toToken(row: EmailVerificationTokenRow): EmailVerificationToken {
  return {
    token: row.token,
    userId: row.user_id,
    email: row.email,
    expiresAt: row.expires_at.toISOString(),
    usedAt: row.used_at?.toISOString() ?? null,
  };
}

export const emailVerificationTokensRepository = {
  async create(
    userId: string,
    email: string,
    expiresAt: Date,
  ): Promise<EmailVerificationToken> {
    const { rows } = await query<EmailVerificationTokenRow>(
      `INSERT INTO email_verification_tokens (user_id, email, expires_at)
       VALUES ($1, $2, $3)
       RETURNING token, user_id, email, expires_at, used_at`,
      [userId, email, expiresAt],
    );
    return toToken(rows[0]!);
  },

  async findActive(token: string): Promise<EmailVerificationToken | undefined> {
    const { rows } = await query<EmailVerificationTokenRow>(
      `SELECT token, user_id, email, expires_at, used_at
       FROM email_verification_tokens
       WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token],
    );
    const row = rows[0];
    return row ? toToken(row) : undefined;
  },

  async markUsed(token: string): Promise<void> {
    await query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1`,
      [token],
    );
  },

  async invalidateForUser(userId: string): Promise<void> {
    await query(
      `UPDATE email_verification_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId],
    );
  },
};

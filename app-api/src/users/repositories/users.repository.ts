import { query } from '../../database/pool.ts';
import type { User, UserRecord } from '../types/user.interface.ts';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  google_id: string | null;
  email_verified: boolean;
  created_at: Date;
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    emailVerified: row.email_verified,
    hasPassword: row.password_hash !== null,
    hasGoogle: row.google_id !== null,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS =
  'id, email, name, avatar_url, password_hash, google_id, email_verified, created_at';

export const usersRepository = {
  async create(input: {
    email: string;
    name: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    googleId: string | null;
    emailVerified: boolean;
  }): Promise<UserRecord> {
    const { rows } = await query<UserRow>(
      `INSERT INTO users (email, name, avatar_url, password_hash, google_id, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [
        input.email,
        input.name,
        input.avatarUrl,
        input.passwordHash,
        input.googleId,
        input.emailVerified,
      ],
    );
    return toRecord(rows[0]!);
  },

  async findById(id: string): Promise<UserRecord | undefined> {
    const { rows } = await query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toRecord(row) : undefined;
  },

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const { rows } = await query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    const row = rows[0];
    return row ? toRecord(row) : undefined;
  },

  async findByGoogleId(googleId: string): Promise<UserRecord | undefined> {
    const { rows } = await query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE google_id = $1`,
      [googleId],
    );
    const row = rows[0];
    return row ? toRecord(row) : undefined;
  },

  async updateName(id: string, name: string | null): Promise<void> {
    await query(`UPDATE users SET name = $1 WHERE id = $2`, [name, id]);
  },

  async delete(id: string): Promise<void> {
    await query(`DELETE FROM users WHERE id = $1`, [id]);
  },

  async markEmailVerified(id: string): Promise<void> {
    await query(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [id]);
  },

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      passwordHash,
      id,
    ]);
  },

  async linkGoogleAccount(
    id: string,
    googleId: string,
    avatarUrl: string | null,
    name: string | null,
  ): Promise<void> {
    await query(
      `UPDATE users
       SET google_id = $1,
           avatar_url = COALESCE(avatar_url, $2),
           name = COALESCE(name, $3),
           email_verified = TRUE
       WHERE id = $4`,
      [googleId, avatarUrl, name, id],
    );
  },
};

export function toPublic(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    avatarUrl: record.avatarUrl,
    emailVerified: record.emailVerified,
    hasPassword: record.hasPassword,
    hasGoogle: record.hasGoogle,
    createdAt: record.createdAt,
  };
}

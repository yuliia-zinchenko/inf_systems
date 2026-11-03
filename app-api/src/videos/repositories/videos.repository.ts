import { query } from '../../database/pool.ts';
import type { Video, VideoSourceType } from '../types/video.interface.ts';

interface VideoRow {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  source_type: VideoSourceType;
  user_id: string | null;
  created_at: Date;
}

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    sourceType: row.source_type,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS =
  'id, title, video_url, thumbnail_url, source_type, user_id, created_at';

export const videosRepository = {
  async create(input: {
    title: string;
    videoUrl: string;
    thumbnailUrl: string | null;
    sourceType: VideoSourceType;
    userId: string | null;
  }): Promise<Video> {
    const { rows } = await query<VideoRow>(
      `INSERT INTO videos (title, video_url, thumbnail_url, source_type, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [
        input.title,
        input.videoUrl,
        input.thumbnailUrl,
        input.sourceType,
        input.userId,
      ],
    );
    return toVideo(rows[0]!);
  },

  async findById(id: string): Promise<Video | undefined> {
    const { rows } = await query<VideoRow>(
      `SELECT ${COLUMNS} FROM videos WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toVideo(row) : undefined;
  },

  async listByUser(userId: string): Promise<Video[]> {
    const { rows } = await query<VideoRow>(
      `SELECT ${COLUMNS} FROM videos WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(toVideo);
  },

  async update(id: string, patch: { title?: string }): Promise<Video | undefined> {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (patch.title !== undefined) {
      values.push(patch.title);
      sets.push(`title = $${values.length}`);
    }
    if (sets.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await query<VideoRow>(
      `UPDATE videos SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
      values,
    );
    const row = rows[0];
    return row ? toVideo(row) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM videos WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};

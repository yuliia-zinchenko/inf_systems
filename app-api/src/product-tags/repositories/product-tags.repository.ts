import { query } from '../../database/pool.ts';
import type {
  ProductTag,
  ProductTagAccent,
  ProductTagVariant,
} from '../types/product-tag.interface.ts';

interface ProductTagRow {
  id: string;
  video_id: string;
  time_sec: string | number;
  duration_sec: string | number;
  title: string;
  image_url: string;
  link: string;
  variant: ProductTagVariant;
  accent_color: ProductTagAccent;
  position_x: string | number | null;
  position_y: string | number | null;
}

const num = (v: string | number): number => (typeof v === 'string' ? Number(v) : v);
const numOrNull = (v: string | number | null): number | null =>
  v === null ? null : num(v);

function toTag(row: ProductTagRow): ProductTag {
  return {
    id: row.id,
    videoId: row.video_id,
    time: num(row.time_sec),
    duration: num(row.duration_sec),
    title: row.title,
    imageUrl: row.image_url,
    link: row.link,
    variant: row.variant,
    accentColor: row.accent_color,
    positionX: numOrNull(row.position_x),
    positionY: numOrNull(row.position_y),
  };
}

const COLUMNS =
  'id, video_id, time_sec, duration_sec, title, image_url, link, variant, accent_color, position_x, position_y';

export const productTagsRepository = {
  async create(input: Omit<ProductTag, 'id'>): Promise<ProductTag> {
    const { rows } = await query<ProductTagRow>(
      `INSERT INTO product_tags
         (video_id, time_sec, duration_sec, title, image_url, link, variant, accent_color, position_x, position_y)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${COLUMNS}`,
      [
        input.videoId,
        input.time,
        input.duration,
        input.title,
        input.imageUrl,
        input.link,
        input.variant,
        input.accentColor,
        input.positionX,
        input.positionY,
      ],
    );
    return toTag(rows[0]!);
  },

  async findById(id: string): Promise<ProductTag | undefined> {
    const { rows } = await query<ProductTagRow>(
      `SELECT ${COLUMNS} FROM product_tags WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toTag(row) : undefined;
  },

  async listByVideo(videoId: string): Promise<ProductTag[]> {
    const { rows } = await query<ProductTagRow>(
      `SELECT ${COLUMNS}
       FROM product_tags
       WHERE video_id = $1
       ORDER BY time_sec ASC`,
      [videoId],
    );
    return rows.map(toTag);
  },

  async update(
    id: string,
    patch: {
      time?: number;
      duration?: number;
      title?: string;
      imageUrl?: string;
      link?: string;
      variant?: ProductTagVariant;
      accentColor?: ProductTagAccent;
      positionX?: number | null;
      positionY?: number | null;
    },
  ): Promise<ProductTag | undefined> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Array<[keyof typeof patch, string]> = [
      ['time', 'time_sec'],
      ['duration', 'duration_sec'],
      ['title', 'title'],
      ['imageUrl', 'image_url'],
      ['link', 'link'],
      ['variant', 'variant'],
      ['accentColor', 'accent_color'],
      ['positionX', 'position_x'],
      ['positionY', 'position_y'],
    ];
    for (const [key, col] of map) {
      const v = patch[key];
      if (v !== undefined) {
        values.push(v);
        sets.push(`${col} = $${values.length}`);
      }
    }
    if (sets.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await query<ProductTagRow>(
      `UPDATE product_tags SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING ${COLUMNS}`,
      values,
    );
    const row = rows[0];
    return row ? toTag(row) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM product_tags WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};

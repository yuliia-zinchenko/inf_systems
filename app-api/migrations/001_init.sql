CREATE TABLE IF NOT EXISTS videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  video_url   TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'upload')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tags (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id  UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  time_sec  DOUBLE PRECISION NOT NULL CHECK (time_sec >= 0),
  title     TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_tags_video ON product_tags(video_id, time_sec);

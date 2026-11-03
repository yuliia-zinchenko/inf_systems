CREATE TABLE IF NOT EXISTS video_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('view', 'tag_click')),
  tag_id      UUID REFERENCES product_tags(id) ON DELETE SET NULL,
  user_agent  TEXT,
  ip_hash     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_events_video ON video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_video_type ON video_events(video_id, type);
CREATE INDEX IF NOT EXISTS idx_video_events_tag ON video_events(tag_id) WHERE tag_id IS NOT NULL;

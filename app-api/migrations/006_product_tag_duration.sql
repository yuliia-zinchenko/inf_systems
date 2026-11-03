ALTER TABLE product_tags
  ADD COLUMN IF NOT EXISTS duration_sec DOUBLE PRECISION NOT NULL DEFAULT 5
    CHECK (duration_sec > 0 AND duration_sec <= 60);

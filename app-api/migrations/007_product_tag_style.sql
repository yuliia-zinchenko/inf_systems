ALTER TABLE product_tags
  ADD COLUMN IF NOT EXISTS variant TEXT NOT NULL DEFAULT 'card'
    CHECK (variant IN ('card', 'compact', 'badge', 'minimal')),
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'fuchsia'
    CHECK (accent_color IN ('fuchsia', 'emerald', 'sky', 'amber', 'rose', 'white')),
  ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION
    CHECK (position_x IS NULL OR (position_x >= 0 AND position_x <= 100)),
  ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION
    CHECK (position_y IS NULL OR (position_y >= 0 AND position_y <= 100));

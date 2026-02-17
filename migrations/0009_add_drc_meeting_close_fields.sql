ALTER TABLE drc_meetings
  ADD COLUMN IF NOT EXISTS closed_at timestamp,
  ADD COLUMN IF NOT EXISTS closed_by text;

CREATE INDEX IF NOT EXISTS idx_drc_meetings_closed_at
  ON drc_meetings(closed_at);

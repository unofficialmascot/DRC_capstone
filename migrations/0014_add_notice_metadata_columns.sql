ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS related_application_id INTEGER,
  ADD COLUMN IF NOT EXISTS related_meeting_id INTEGER;

CREATE INDEX IF NOT EXISTS notices_target_role_date_idx
  ON notices (target_role, date DESC);

CREATE INDEX IF NOT EXISTS notices_notification_type_idx
  ON notices (notification_type);

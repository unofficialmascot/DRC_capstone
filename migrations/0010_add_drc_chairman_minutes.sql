CREATE TABLE IF NOT EXISTS drc_meeting_minutes (
  id serial PRIMARY KEY,
  meeting_id integer NOT NULL REFERENCES drc_meetings(id) ON DELETE CASCADE,
  generated_by text NOT NULL,
  generated_at timestamp DEFAULT now(),
  CONSTRAINT drc_meeting_minutes_meeting_unique UNIQUE (meeting_id)
);

CREATE TABLE IF NOT EXISTS drc_minute_items (
  id serial PRIMARY KEY,
  meeting_id integer NOT NULL REFERENCES drc_meetings(id) ON DELETE CASCADE,
  application_id integer NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  approval_count integer NOT NULL DEFAULT 0,
  rejection_count integer NOT NULL DEFAULT 0,
  member_summary jsonb,
  created_at timestamp DEFAULT now(),
  CONSTRAINT drc_minute_items_unique UNIQUE (meeting_id, application_id)
);

CREATE TABLE IF NOT EXISTS drc_chairman_decisions (
  id serial PRIMARY KEY,
  meeting_id integer NOT NULL REFERENCES drc_meetings(id) ON DELETE CASCADE,
  application_id integer NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  chairman_id text NOT NULL,
  decision text NOT NULL,
  remarks text NOT NULL,
  decided_at timestamp DEFAULT now(),
  CONSTRAINT drc_chairman_decisions_unique UNIQUE (meeting_id, application_id)
);

CREATE INDEX IF NOT EXISTS idx_drc_minute_items_meeting_id ON drc_minute_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_drc_chairman_decisions_meeting_id ON drc_chairman_decisions(meeting_id);

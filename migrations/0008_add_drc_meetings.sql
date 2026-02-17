CREATE TABLE IF NOT EXISTS drc_meetings (
  id serial PRIMARY KEY,
  meeting_date timestamp NOT NULL,
  scheduled_by text NOT NULL,
  scheduled_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drc_meeting_applications (
  id serial PRIMARY KEY,
  meeting_id integer NOT NULL REFERENCES drc_meetings(id) ON DELETE CASCADE,
  application_id integer NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  added_at timestamp DEFAULT now(),
  CONSTRAINT drc_meeting_applications_unique UNIQUE (meeting_id, application_id)
);

CREATE TABLE IF NOT EXISTS drc_agenda_points (
  id serial PRIMARY KEY,
  meeting_id integer NOT NULL REFERENCES drc_meetings(id) ON DELETE CASCADE,
  point text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drc_meeting_applications_meeting_id
  ON drc_meeting_applications(meeting_id);

CREATE INDEX IF NOT EXISTS idx_drc_agenda_points_meeting_id
  ON drc_agenda_points(meeting_id);

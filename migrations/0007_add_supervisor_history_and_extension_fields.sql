ALTER TABLE scholars
  ADD COLUMN IF NOT EXISTS extension_months_granted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_extension_approved_at timestamp;

CREATE TABLE IF NOT EXISTS supervisor_change_history (
  id serial PRIMARY KEY,
  scholar_id text NOT NULL,
  application_id integer NOT NULL,
  previous_supervisor_id text,
  new_supervisor_id text NOT NULL,
  changed_at timestamp DEFAULT now()
);

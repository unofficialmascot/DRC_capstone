-- Create table to track course completion per scholar
BEGIN;

CREATE TABLE IF NOT EXISTS course_completion (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_on date,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

COMMIT;

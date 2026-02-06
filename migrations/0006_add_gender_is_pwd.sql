-- Add gender and is_pwd columns to scholar_personal_details
-- Safe migration: add nullable gender and default false for is_pwd
BEGIN;

ALTER TABLE IF EXISTS scholar_personal_details
  ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE IF EXISTS scholar_personal_details
  ADD COLUMN IF NOT EXISTS is_pwd boolean DEFAULT false;

COMMIT;

-- Optional: update existing records with guessed values if you have a mapping
-- UPDATE scholar_personal_details SET gender = 'Male' WHERE scholar_id IN (...);

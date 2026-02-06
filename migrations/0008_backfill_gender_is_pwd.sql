-- Backfill gender and is_pwd defaults for existing scholar_personal_details
BEGIN;

ALTER TABLE scholar_personal_details
  ALTER COLUMN gender SET DEFAULT 'Male';

UPDATE scholar_personal_details
  SET gender = COALESCE(gender, 'Male'), is_pwd = COALESCE(is_pwd, false);

COMMIT;

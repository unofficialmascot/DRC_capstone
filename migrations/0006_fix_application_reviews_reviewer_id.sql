-- Fix reviewer_id type to TEXT and align FK to employees
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'application_reviews'
      AND column_name = 'reviewer_id'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE application_reviews DROP CONSTRAINT IF EXISTS application_reviews_reviewer_id_fkey;
    ALTER TABLE application_reviews ALTER COLUMN reviewer_id TYPE TEXT USING reviewer_id::text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'application_reviews_reviewer_id_fkey'
  ) THEN
    ALTER TABLE application_reviews
      ADD CONSTRAINT application_reviews_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES employees(employee_id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_application_reviews_application_id
  ON application_reviews (application_id);

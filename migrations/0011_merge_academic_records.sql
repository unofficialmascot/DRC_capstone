-- Migration 0011: Merge academic_records into scholar_education_background
-- Adds missing institute_name column, migrates data, and drops unused tables.

-- Add institute_name to canonical table
ALTER TABLE scholar_education_background
ADD COLUMN IF NOT EXISTS institute_name TEXT;

-- Migrate academic_records data into scholar_education_background when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholar_education_background'
      AND column_name = 'user_id'
  ) THEN
    INSERT INTO scholar_education_background (
      user_id,
      education_level,
      board_or_university,
      institute_name,
      percentage_or_cgpa,
      year_of_completion
    )
    SELECT
      user_id,
      level,
      board_or_university,
      institute_name,
      percentage_or_cgpa,
      year_of_passing
    FROM academic_records
    ON CONFLICT (user_id, education_level)
    DO UPDATE SET
      board_or_university = COALESCE(scholar_education_background.board_or_university, EXCLUDED.board_or_university),
      institute_name = COALESCE(scholar_education_background.institute_name, EXCLUDED.institute_name),
      percentage_or_cgpa = COALESCE(scholar_education_background.percentage_or_cgpa, EXCLUDED.percentage_or_cgpa),
      year_of_completion = COALESCE(scholar_education_background.year_of_completion, EXCLUDED.year_of_completion);
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholar_education_background'
      AND column_name = 'scholar_id'
  ) THEN
    INSERT INTO scholar_education_background (
      scholar_id,
      education_level,
      board_or_university,
      institute_name,
      percentage_or_cgpa,
      year_of_completion
    )
    SELECT
      user_id,
      level,
      board_or_university,
      institute_name,
      percentage_or_cgpa,
      year_of_passing
    FROM academic_records
    ON CONFLICT (scholar_id, education_level)
    DO UPDATE SET
      board_or_university = COALESCE(scholar_education_background.board_or_university, EXCLUDED.board_or_university),
      institute_name = COALESCE(scholar_education_background.institute_name, EXCLUDED.institute_name),
      percentage_or_cgpa = COALESCE(scholar_education_background.percentage_or_cgpa, EXCLUDED.percentage_or_cgpa),
      year_of_completion = COALESCE(scholar_education_background.year_of_completion, EXCLUDED.year_of_completion);
  END IF;
END $$;

-- Drop legacy tables now that data is migrated
DROP TABLE IF EXISTS academic_certificates CASCADE;
DROP TABLE IF EXISTS academic_records CASCADE;

-- Fix research_progress.scholar_id column type from integer to text
-- The column was incorrectly created as integer; scholar IDs are text strings (e.g. "PHD12345")
ALTER TABLE research_progress ALTER COLUMN scholar_id TYPE text USING scholar_id::text;

ALTER TABLE scholars
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'Active';

UPDATE scholars
SET lifecycle_status = CASE
  WHEN status = 'Graduated' THEN 'Awarded'
  WHEN status = 'Inactive' THEN 'Deregistered'
  ELSE 'Active'
END
WHERE lifecycle_status IS NULL OR lifecycle_status = '';

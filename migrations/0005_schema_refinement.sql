-- Migration: Schema Refinement and Normalization
-- Date: 2026-02-06
-- Purpose: Remove redundancies, normalize structure, add missing constraints

-- ============================================================================
-- PHASE 1: CREATE NEW NORMALIZED TABLES
-- ============================================================================

-- New table: Scholar education background (10th, 12th grades)
CREATE TABLE IF NOT EXISTS scholar_education_background (
  id SERIAL PRIMARY KEY,
  scholar_id INTEGER NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  education_level TEXT NOT NULL, -- '10th', '12th', 'UG', 'PG'
  board_or_university TEXT NOT NULL,
  percentage_or_cgpa NUMERIC(5,2),
  year_of_completion INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scholar_id, education_level)
);

-- New consolidated table: Scholar reviews (replaces review_cycles, review_status, review_outcome)
CREATE TABLE IF NOT EXISTS scholar_reviews (
  review_id SERIAL PRIMARY KEY,
  scholar_id INTEGER NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  review_month INTEGER NOT NULL,
  review_year INTEGER NOT NULL,
  review_type TEXT NOT NULL DEFAULT 'PERIODIC', -- 'PERIODIC', 'SPECIAL', 'ANNUAL'
  current_stage TEXT NOT NULL DEFAULT 'NOT_STARTED', -- 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
  current_status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'REJECTED'
  final_result TEXT, -- 'PASS', 'FAIL', 'CONDITIONAL', NULL if in progress
  submitted_date TIMESTAMP,
  completed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scholar_id, review_month, review_year)
);

-- ============================================================================
-- PHASE 2: DATA MIGRATION (if tables exist and have data)
-- ============================================================================

-- Migrate education background data from scholars table
INSERT INTO scholar_education_background (scholar_id, education_level, board_or_university, percentage_or_cgpa, year_of_completion)
SELECT 
  id,
  '10th' as education_level,
  tenth_board,
  CAST(tenth_percentage AS NUMERIC(5,2)),
  NULL
FROM scholars
WHERE tenth_board IS NOT NULL OR tenth_percentage IS NOT NULL
ON CONFLICT (scholar_id, education_level) DO NOTHING;

INSERT INTO scholar_education_background (scholar_id, education_level, board_or_university, percentage_or_cgpa, year_of_completion)
SELECT 
  id,
  '12th' as education_level,
  inter_board,
  CAST(inter_percentage AS NUMERIC(5,2)),
  NULL
FROM scholars
WHERE inter_board IS NOT NULL OR inter_percentage IS NOT NULL
ON CONFLICT (scholar_id, education_level) DO NOTHING;

-- Migrate review data from fragmented tables (if they exist)
INSERT INTO scholar_reviews (scholar_id, review_month, review_year, review_type, current_status, final_result)
SELECT 
  id,
  review_month,
  review_year,
  review_type,
  'COMPLETED' as current_status,
  (SELECT final_result FROM review_outcome ro WHERE ro.review_id = review_cycles.review_id LIMIT 1)
FROM review_cycles
ON CONFLICT (scholar_id, review_month, review_year) DO NOTHING;

-- ============================================================================
-- PHASE 3: NORMALIZE SCHOLARS TABLE
-- ============================================================================

-- Remove denormalized fields from scholars table
-- (These are now in scholar_education_background, scholar_personal_details, and scholar_supervisors)
ALTER TABLE scholars DROP COLUMN IF EXISTS tenth_board;
ALTER TABLE scholars DROP COLUMN IF EXISTS tenth_percentage;
ALTER TABLE scholars DROP COLUMN IF EXISTS inter_board;
ALTER TABLE scholars DROP COLUMN IF EXISTS inter_percentage;
ALTER TABLE scholars DROP COLUMN IF EXISTS father_name;
ALTER TABLE scholars DROP COLUMN IF EXISTS parent_mobile;
ALTER TABLE scholars DROP COLUMN IF EXISTS aadhaar;
ALTER TABLE scholars DROP COLUMN IF EXISTS nationality;
ALTER TABLE scholars DROP COLUMN IF EXISTS address;

-- Remove supervisor fields (now in scholar_supervisors table)
ALTER TABLE scholars DROP COLUMN IF EXISTS supervisor_id;
ALTER TABLE scholars DROP COLUMN IF EXISTS co_supervisor_id;

-- Make scholar_id a regular INTEGER PK if it isn't already
-- (Depends on current schema structure)

-- ============================================================================
-- PHASE 4: ADD MISSING CONSTRAINTS
-- ============================================================================

-- Ensure applications.scholar_id has proper FK constraint
ALTER TABLE applications 
ADD CONSTRAINT fk_applications_scholar_id FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE;

-- Ensure scholar_id in applications is NOT NULL
-- ALTER TABLE applications ALTER COLUMN scholar_id SET NOT NULL;

-- Add FK constraint to scholar_supervisors if it doesn't exist
ALTER TABLE scholar_supervisors
ADD CONSTRAINT fk_scholar_supervisors_scholar_id FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE;

ALTER TABLE scholar_supervisors
ADD CONSTRAINT fk_scholar_supervisors_supervisor_id FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add FK constraint to scholar_rac_members if it doesn't exist
ALTER TABLE scholar_rac_members
ADD CONSTRAINT fk_scholar_rac_members_scholar_id FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE;

-- Link fee_demand to fee_structure
ALTER TABLE scholar_fee_demand
ADD COLUMN IF NOT EXISTS fee_id INTEGER REFERENCES fee_structure(fee_id) ON DELETE SET NULL;

-- ============================================================================
-- PHASE 5: DROP REDUNDANT TABLES (OPTIONAL - Comment out if you want to keep)
-- ============================================================================

-- Drop consolidated tables once Scholar_reviews is populated and tested
-- DROP TABLE IF EXISTS review_status CASCADE;
-- DROP TABLE IF EXISTS review_outcome CASCADE;
-- DROP TABLE IF EXISTS review_cycles CASCADE;

-- Drop redundant rac_members table (scholar_rac_members is the primary)
-- DROP TABLE IF EXISTS rac_members CASCADE;

-- ============================================================================
-- PHASE 6: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scholar_education_background_scholar_id ON scholar_education_background(scholar_id);
CREATE INDEX IF NOT EXISTS idx_scholar_reviews_scholar_id ON scholar_reviews(scholar_id);
CREATE INDEX IF NOT EXISTS idx_scholar_reviews_year_month ON scholar_reviews(review_year, review_month);
CREATE INDEX IF NOT EXISTS idx_scholar_fee_demand_academic_year ON scholar_fee_demand(academic_year);
CREATE INDEX IF NOT EXISTS idx_applications_scholar_id ON applications(scholar_id);
CREATE INDEX IF NOT EXISTS idx_applications_current_stage ON applications(current_stage, status);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('scholar_education_background', 'scholar_reviews');

-- Verify education background data migrated
SELECT COUNT(*) as education_records FROM scholar_education_background;

-- Verify reviews data migrated  
SELECT COUNT(*) as review_records FROM scholar_reviews;

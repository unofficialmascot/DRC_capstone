-- Migration: Normalize IDs across Users, Scholars, and Employees
-- This migration restructures the schema to use:
-- - Users: id (serial) as primary key (no username, login via scholar_id or employee_id)
-- - Scholars: scholar_id (text) as primary key
-- - Employees: employee_id (text) as primary key with supervisor relationships

-- Step 0: Drop username column from users table
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Step 1: Create the employees table
CREATE TABLE IF NOT EXISTS employees (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  designation TEXT,
  department TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Backup existing scholars data
CREATE TABLE IF NOT EXISTS scholars_backup AS
SELECT * FROM scholars WHERE FALSE;

INSERT INTO scholars_backup SELECT * FROM scholars;

-- Step 3: Drop dependent tables first (cascade will not work with some constraints)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS application_reviews CASCADE;
DROP TABLE IF EXISTS rac_members CASCADE;
DROP TABLE IF EXISTS research_progress CASCADE;
DROP TABLE IF EXISTS scholar_supervisors CASCADE;

-- Step 4: Recreate scholars table with scholar_id as primary key
DROP TABLE IF EXISTS scholars CASCADE;

CREATE TABLE scholars (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  scholar_id TEXT UNIQUE,
  batch TEXT,
  status TEXT DEFAULT 'Active',
  department TEXT,
  research_area TEXT,
  research_title TEXT,
  joining_date TEXT,
  phase TEXT,
  programme TEXT,
  location TEXT,
  supervisor_user_id INTEGER REFERENCES users(id),
  co_supervisor_user_id INTEGER REFERENCES users(id),
  father_name TEXT,
  parent_mobile TEXT,
  aadhaar TEXT,
  nationality TEXT,
  address TEXT,
  tenth_board TEXT,
  tenth_percentage TEXT,
  inter_board TEXT,
  inter_percentage TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Recreate rac_members table
CREATE TABLE rac_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL,
  assigned_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, member_user_id)
);

-- Step 6: Recreate applications table
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  current_stage TEXT NOT NULL DEFAULT 'supervisor',
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  final_outcome TEXT
);

-- Step 7: Recreate application_reviews table
CREATE TABLE application_reviews (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  remarks TEXT NOT NULL,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 8: Recreate research_progress table
CREATE TABLE research_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_reviews INTEGER DEFAULT 0,
  pending_reports INTEGER DEFAULT 0,
  publications INTEGER DEFAULT 0,
  last_review_date TIMESTAMP,
  UNIQUE(user_id)
);

-- Step 9: Restore scholar data (if any exists)
-- Note: Manual data migration may be needed based on previous schema state

-- Step 10: Keep backup for reference (optional - comment out to delete)
-- DROP TABLE scholars_backup;


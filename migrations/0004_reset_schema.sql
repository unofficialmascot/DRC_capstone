-- Migration: Complete Schema Reset and Rebuild
-- This drops the old schema and rebuilds from scratch with the new normalized structure

-- Drop all old tables
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS scholar_fee_demand CASCADE;
DROP TABLE IF EXISTS fee_structure CASCADE;
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS scholar_address CASCADE;
DROP TABLE IF EXISTS scholar_personal_details CASCADE;
DROP TABLE IF EXISTS scholar_rac_members CASCADE;
DROP TABLE IF EXISTS review_outcome CASCADE;
DROP TABLE IF EXISTS review_status CASCADE;
DROP TABLE IF EXISTS review_cycles CASCADE;
DROP TABLE IF EXISTS pre_phd_exams CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS scholar_fee_demand CASCADE;
DROP TABLE IF EXISTS fee_structure CASCADE;
DROP TABLE IF EXISTS pre_phd_subject_results CASCADE;
DROP TABLE IF EXISTS application_reviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS research_progress CASCADE;
DROP TABLE IF EXISTS rac_members CASCADE;
DROP TABLE IF EXISTS scholar_supervisors CASCADE;
DROP TABLE IF EXISTS scholars CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table without username
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE employees (
  employee_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation TEXT,
  department TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scholars table
CREATE TABLE scholars (
  scholar_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  batch TEXT,
  status TEXT DEFAULT 'Active',
  department TEXT,
  research_area TEXT,
  research_title TEXT,
  joining_date TEXT,
  phase TEXT,
  programme TEXT,
  location TEXT,
  supervisor_id TEXT REFERENCES employees(employee_id),
  co_supervisor_id TEXT REFERENCES employees(employee_id),
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

-- Create rac_members table
CREATE TABLE rac_members (
  id SERIAL PRIMARY KEY,
  scholar_id TEXT NOT NULL REFERENCES scholars(scholar_id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  member_role TEXT NOT NULL,
  assigned_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scholar_id, employee_id)
);

-- Create applications table
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  scholar_id TEXT NOT NULL REFERENCES scholars(scholar_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  current_stage TEXT NOT NULL DEFAULT 'supervisor',
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  final_outcome TEXT
);

-- Create application_reviews table
CREATE TABLE application_reviews (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  remarks TEXT NOT NULL,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create research_progress table
CREATE TABLE research_progress (
  id SERIAL PRIMARY KEY,
  scholar_id TEXT NOT NULL REFERENCES scholars(scholar_id) ON DELETE CASCADE,
  completed_reviews INTEGER DEFAULT 0,
  pending_reports INTEGER DEFAULT 0,
  publications INTEGER DEFAULT 0,
  last_review_date TIMESTAMP,
  UNIQUE(scholar_id)
);

-- Create notices table
CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  target_role TEXT
);

-- Create indexes
CREATE INDEX idx_scholars_user_id ON scholars(user_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_applications_scholar_id ON applications(scholar_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_current_stage ON applications(current_stage);
CREATE INDEX idx_application_reviews_application_id ON application_reviews(application_id);
CREATE INDEX idx_application_reviews_reviewer_id ON application_reviews(reviewer_id);
CREATE INDEX idx_rac_members_scholar_id ON rac_members(scholar_id);
CREATE INDEX idx_rac_members_employee_id ON rac_members(employee_id);
CREATE INDEX idx_research_progress_scholar_id ON research_progress(scholar_id);
CREATE INDEX idx_users_email ON users(email);

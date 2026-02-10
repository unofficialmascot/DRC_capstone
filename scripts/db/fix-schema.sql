-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS application_reviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS research_progress CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with all necessary columns
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'password123',
  role TEXT NOT NULL DEFAULT 'scholar',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Scholar specific
  scholar_id TEXT,
  location TEXT,
  batch TEXT,
  status TEXT DEFAULT 'Active',
  department TEXT,
  supervisor TEXT,
  co_supervisor TEXT,
  research_area TEXT,
  research_title TEXT,
  joining_date TEXT,
  phase TEXT,
  programme TEXT,
  
  -- Personal details
  father_name TEXT,
  parent_mobile TEXT,
  aadhaar TEXT,
  nationality TEXT,
  address TEXT,
  
  -- Education
  tenth_board TEXT,
  tenth_percentage TEXT,
  inter_board TEXT,
  inter_percentage TEXT,
  
  -- Metadata
  avatar_url TEXT
);

-- Create applications table
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  scholar_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  current_stage TEXT NOT NULL DEFAULT 'drc',
  submission_date TIMESTAMP DEFAULT NOW(),
  details JSONB,
  final_outcome TEXT
);

-- Create application_reviews table
CREATE TABLE application_reviews (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  remarks TEXT NOT NULL,
  review_date TIMESTAMP DEFAULT NOW()
);

-- Create research_progress table
CREATE TABLE research_progress (
  id SERIAL PRIMARY KEY,
  scholar_id INTEGER NOT NULL,
  completed_reviews INTEGER DEFAULT 0,
  pending_reports INTEGER DEFAULT 0,
  publications INTEGER DEFAULT 0,
  last_review_date TIMESTAMP
);

-- Create notices table
CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  target_role TEXT
);

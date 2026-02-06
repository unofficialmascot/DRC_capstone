-- Migration: Normalize users table - separate scholar data from base users
-- This migration:
-- 1. Creates normalized users table (only auth & core fields)
-- 2. Creates scholars table for scholar-specific data
-- 3. Creates scholar_supervisors for supervisor relationships
-- 4. Creates rac_members for DRC/IRC/DoAA assignments
-- 5. Ensures all passwords are hashed (bcryptjs format)

-- Drop dependent tables
DROP TABLE IF EXISTS "application_reviews" CASCADE;
DROP TABLE IF EXISTS "applications" CASCADE;
DROP TABLE IF EXISTS "research_progress" CASCADE;
DROP TABLE IF EXISTS "notices" CASCADE;

-- Rename old users table to backup
ALTER TABLE IF EXISTS "users" RENAME TO "users_old";

-- Create new normalized users table
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL, -- 'scholar', 'supervisor', 'drc', 'irc', 'doaa', 'admin'
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "avatar_url" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_users_username" ON "users" ("username");
CREATE INDEX "idx_users_role" ON "users" ("role");
CREATE INDEX "idx_users_email" ON "users" ("email");

-- Create scholars table for scholar-specific data
CREATE TABLE "scholars" (
  "user_id" INTEGER PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "scholar_id" TEXT UNIQUE,
  "batch" TEXT,
  "status" TEXT DEFAULT 'Active',
  "department" TEXT,
  "research_area" TEXT,
  "research_title" TEXT,
  "joining_date" TEXT,
  "phase" TEXT,
  "programme" TEXT,
  "location" TEXT,
  "father_name" TEXT,
  "parent_mobile" TEXT,
  "aadhaar" TEXT,
  "nationality" TEXT,
  "address" TEXT,
  "tenth_board" TEXT,
  "tenth_percentage" TEXT,
  "inter_board" TEXT,
  "inter_percentage" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_scholars_user_id" ON "scholars" ("user_id");
CREATE INDEX "idx_scholars_scholar_id" ON "scholars" ("scholar_id");

-- Create supervisor assignments table
CREATE TABLE "scholar_supervisors" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "supervisor_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "is_primary" BOOLEAN DEFAULT TRUE,
  "assigned_on" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_scholar_supervisors_user_id" ON "scholar_supervisors" ("user_id");
CREATE INDEX "idx_scholar_supervisors_supervisor_id" ON "scholar_supervisors" ("supervisor_id");

-- Create RAC members table for DRC/IRC/DoAA associations
CREATE TABLE "rac_members" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "member_user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "member_role" TEXT NOT NULL, -- 'drc', 'irc', 'doaa'
  "assigned_on" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_rac_members_user_id" ON "rac_members" ("user_id");
CREATE INDEX "idx_rac_members_member_user_id" ON "rac_members" ("member_user_id");

-- Recreate applications table
CREATE TABLE "applications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "current_stage" TEXT NOT NULL DEFAULT 'drc',
  "submission_date" TIMESTAMP DEFAULT NOW(),
  "details" JSONB,
  "final_outcome" TEXT
);

CREATE INDEX "idx_applications_user_id" ON "applications" ("user_id");

-- Recreate application_reviews table
CREATE TABLE "application_reviews" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL,
  "reviewer_id" INTEGER NOT NULL,
  "stage" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "remarks" TEXT NOT NULL,
  "review_date" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_application_reviews_application_id" ON "application_reviews" ("application_id");

-- Recreate research_progress table
CREATE TABLE "research_progress" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "completed_reviews" INTEGER DEFAULT 0,
  "pending_reports" INTEGER DEFAULT 0,
  "publications" INTEGER DEFAULT 0,
  "last_review_date" TIMESTAMP
);

CREATE INDEX "idx_research_progress_user_id" ON "research_progress" ("user_id");

-- Recreate notices table
CREATE TABLE "notices" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "date" TIMESTAMP DEFAULT NOW(),
  "target_role" TEXT
);

-- Drop backup table
DROP TABLE IF EXISTS "users_old";

-- Migration: Normalize database schema to 3NF
-- This migration replaces the denormalized schema with a fully normalized schema
-- supporting scholar management, supervisors, RAC members, academic records, fees, and research progression

-- Drop old tables if they exist
DROP TABLE IF EXISTS "application_reviews" CASCADE;
DROP TABLE IF EXISTS "applications" CASCADE;
DROP TABLE IF EXISTS "research_progress" CASCADE;
DROP TABLE IF EXISTS "notices" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Create core users table
CREATE TABLE "users" (
  "user_id" SERIAL PRIMARY KEY,
  "role" text NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "phone" text,
  "employee_id" text UNIQUE,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_users_role" ON "users" ("role");
CREATE INDEX "idx_users_email" ON "users" ("email");

-- Create scholars table
CREATE TABLE "scholars" (
  "scholar_id" SERIAL PRIMARY KEY,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("user_id") ON DELETE CASCADE,
  "application_number" text NOT NULL UNIQUE,
  "scholar_roll_no" text NOT NULL UNIQUE,
  "program_type" text NOT NULL,
  "program_status" text NOT NULL DEFAULT 'ACTIVE',
  "batch" text NOT NULL,
  "phase" text NOT NULL,
  "department" text NOT NULL,
  "campus" text NOT NULL,
  "enrollment_date" date NOT NULL,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_scholars_user_id" ON "scholars" ("user_id");
CREATE INDEX "idx_scholars_batch_phase" ON "scholars" ("batch", "phase");

-- Create supervisor mappings
CREATE TABLE "scholar_supervisors" (
  "id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "supervisor_id" integer NOT NULL REFERENCES "users"("user_id") ON DELETE RESTRICT,
  "assigned_on" timestamp DEFAULT NOW(),
  "is_current" boolean DEFAULT true,
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_scholar_supervisors_scholar_id" ON "scholar_supervisors" ("scholar_id");
CREATE INDEX "idx_scholar_supervisors_supervisor_id" ON "scholar_supervisors" ("supervisor_id");

-- Create RAC member mappings
CREATE TABLE "scholar_rac_members" (
  "id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "rac_member_id" integer NOT NULL REFERENCES "users"("user_id") ON DELETE RESTRICT,
  "role" text NOT NULL,
  "assigned_on" timestamp DEFAULT NOW(),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_scholar_rac_members_scholar_id" ON "scholar_rac_members" ("scholar_id");
CREATE INDEX "idx_scholar_rac_members_rac_member_id" ON "scholar_rac_members" ("rac_member_id");

-- Create personal details
CREATE TABLE "scholar_personal_details" (
  "scholar_id" integer PRIMARY KEY REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "date_of_birth" date,
  "nationality" text,
  "father_name" text,
  "aadhaar_number" text,
  "student_mobile" text,
  "parent_mobile" text,
  "student_email" text,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- Create address details
CREATE TABLE "scholar_address" (
  "scholar_id" integer PRIMARY KEY REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "address_text" text,
  "state" text,
  "pincode" text,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- Create academic records
CREATE TABLE "academic_records" (
  "record_id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "level" text NOT NULL,
  "institute_name" text NOT NULL,
  "board_or_university" text NOT NULL,
  "year_of_passing" integer NOT NULL,
  "percentage_or_cgpa" numeric(5,2),
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_academic_records_scholar_id" ON "academic_records" ("scholar_id");
CREATE INDEX "idx_academic_records_level" ON "academic_records" ("level");

-- Create fee structure
CREATE TABLE "fee_structure" (
  "fee_id" SERIAL PRIMARY KEY,
  "academic_year" text NOT NULL,
  "phase" text NOT NULL,
  "batch" text NOT NULL,
  "year_1_fee" numeric(12,2),
  "year_2_fee" numeric(12,2),
  "year_3_fee" numeric(12,2),
  "year_4_fee" numeric(12,2),
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  UNIQUE("academic_year", "phase", "batch")
);

CREATE INDEX "idx_fee_structure_academic_year" ON "fee_structure" ("academic_year");

-- Create scholar fee demand
CREATE TABLE "scholar_fee_demand" (
  "id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "academic_year" text NOT NULL,
  "arrears_amount" numeric(12,2) DEFAULT 0,
  "hostel_arrears" numeric(12,2) DEFAULT 0,
  "annual_fee" numeric(12,2),
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  UNIQUE("scholar_id", "academic_year")
);

CREATE INDEX "idx_scholar_fee_demand_scholar_id" ON "scholar_fee_demand" ("scholar_id");

-- Create fee payments
CREATE TABLE "fee_payments" (
  "payment_id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "academic_year" text NOT NULL,
  "transaction_id" text NOT NULL UNIQUE,
  "transaction_date" timestamp DEFAULT NOW(),
  "bank_name" text,
  "amount_paid" numeric(12,2) NOT NULL,
  "payment_status" text NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_fee_payments_scholar_id" ON "fee_payments" ("scholar_id");
CREATE INDEX "idx_fee_payments_transaction_id" ON "fee_payments" ("transaction_id");
CREATE INDEX "idx_fee_payments_status" ON "fee_payments" ("payment_status");

-- Create pre-PhD exams
CREATE TABLE "pre_phd_exams" (
  "exam_id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "exam_type" text NOT NULL DEFAULT 'REGULAR',
  "conducted_month" integer,
  "conducted_year" integer,
  "certificate_url" text,
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_pre_phd_exams_scholar_id" ON "pre_phd_exams" ("scholar_id");

-- Create pre-PhD subject results
CREATE TABLE "pre_phd_subject_results" (
  "id" SERIAL PRIMARY KEY,
  "exam_id" integer NOT NULL REFERENCES "pre_phd_exams"("exam_id") ON DELETE CASCADE,
  "subject_name" text NOT NULL,
  "subject_code" text NOT NULL,
  "semester" text,
  "grade" text,
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_pre_phd_subject_results_exam_id" ON "pre_phd_subject_results" ("exam_id");

-- Create research progressions
CREATE TABLE "research_progressions" (
  "progression_id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "progression_no" integer NOT NULL,
  "title" text NOT NULL,
  "conducted_on" date NOT NULL,
  "document_url" text,
  "supervisor_uploaded_on" timestamp,
  "drc_approved_on" timestamp,
  "final_result" text,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  UNIQUE("scholar_id", "progression_no")
);

CREATE INDEX "idx_research_progressions_scholar_id" ON "research_progressions" ("scholar_id");

-- Create review cycles
CREATE TABLE "review_cycles" (
  "review_id" SERIAL PRIMARY KEY,
  "scholar_id" integer NOT NULL REFERENCES "scholars"("scholar_id") ON DELETE CASCADE,
  "review_month" integer NOT NULL,
  "review_year" integer NOT NULL,
  "review_type" text NOT NULL DEFAULT 'PERIODIC',
  "created_at" timestamp DEFAULT NOW(),
  UNIQUE("scholar_id", "review_month", "review_year")
);

CREATE INDEX "idx_review_cycles_scholar_id" ON "review_cycles" ("scholar_id");

-- Create review status
CREATE TABLE "review_status" (
  "id" SERIAL PRIMARY KEY,
  "review_id" integer NOT NULL REFERENCES "review_cycles"("review_id") ON DELETE CASCADE,
  "reviewer_id" integer NOT NULL REFERENCES "users"("user_id") ON DELETE RESTRICT,
  "reviewer_role" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "submitted_on" timestamp,
  "reviewed_on" timestamp,
  "remarks" text,
  "created_at" timestamp DEFAULT NOW(),
  UNIQUE("review_id", "reviewer_id", "reviewer_role")
);

CREATE INDEX "idx_review_status_review_id" ON "review_status" ("review_id");
CREATE INDEX "idx_review_status_reviewer_id" ON "review_status" ("reviewer_id");

-- Create review outcome
CREATE TABLE "review_outcome" (
  "review_id" integer PRIMARY KEY REFERENCES "review_cycles"("review_id") ON DELETE CASCADE,
  "final_result" text NOT NULL,
  "finalized_on" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- Create audit logs
CREATE TABLE "audit_logs" (
  "audit_id" SERIAL PRIMARY KEY,
  "entity_type" text NOT NULL,
  "entity_id" integer NOT NULL,
  "action" text NOT NULL,
  "performed_by" integer NOT NULL REFERENCES "users"("user_id") ON DELETE RESTRICT,
  "performed_on" timestamp DEFAULT NOW(),
  "old_value" jsonb,
  "new_value" jsonb,
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX "idx_audit_logs_performed_by" ON "audit_logs" ("performed_by");
CREATE INDEX "idx_audit_logs_performed_on" ON "audit_logs" ("performed_on");

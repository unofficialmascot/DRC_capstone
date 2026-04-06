-- Add has_fees_due column to scholars table
ALTER TABLE scholars ADD COLUMN IF NOT EXISTS has_fees_due boolean NOT NULL DEFAULT false;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  scholar_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  verified_at TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_scholar_id ON documents(scholar_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

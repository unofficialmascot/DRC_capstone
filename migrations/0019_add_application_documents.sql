CREATE TABLE IF NOT EXISTS application_documents (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  requirement_code TEXT,
  attached_by TEXT NOT NULL DEFAULT 'scholar',
  attached_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_documents_application_idx
  ON application_documents (application_id);

CREATE INDEX IF NOT EXISTS application_documents_document_idx
  ON application_documents (document_id);

CREATE UNIQUE INDEX IF NOT EXISTS application_documents_application_document_idx
  ON application_documents (application_id, document_id);
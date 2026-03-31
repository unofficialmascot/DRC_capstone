CREATE TABLE IF NOT EXISTS document_signatures (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  signer_id TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  label TEXT NOT NULL,
  signed_at TIMESTAMP,
  asset_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_signatures_entity_idx
  ON document_signatures(entity_type, entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS document_signatures_entity_signer_idx
  ON document_signatures(entity_type, entity_id, signer_id);

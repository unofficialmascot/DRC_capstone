-- Drop the document_signatures table as signatures are no longer tracked per meeting
DROP INDEX IF EXISTS document_signatures_entity_signer_idx;
DROP INDEX IF EXISTS document_signatures_entity_idx;
DROP TABLE IF EXISTS document_signatures;

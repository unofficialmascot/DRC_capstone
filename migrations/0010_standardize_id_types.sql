-- Migration 0010: Standardize ID types across applications-related tables
-- Convert text-based foreign keys to numeric IDs for consistency

-- === APPLICATIONS TABLE ===
-- Change applications.scholarId from text to integer (FK to scholars.id)
ALTER TABLE applications
ALTER COLUMN scholar_id TYPE integer USING NULL;

-- Add the NOT NULL constraint after conversion
ALTER TABLE applications
ADD CONSTRAINT applications_scholar_id_fk FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE;

-- === APPLICATION_REVIEWS TABLE ===
-- Change applicationReviews.reviewerId from text to integer (FK to users.id)
ALTER TABLE application_reviews
ALTER COLUMN reviewer_id TYPE integer USING NULL;

-- Add the NOT NULL constraint after conversion
ALTER TABLE application_reviews
ADD CONSTRAINT application_reviews_reviewer_id_fk FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT;

-- === APPLICATION_DOCUMENTS TABLE ===
-- Change applicationDocuments.uploadedBy from text to integer (FK to users.id)
ALTER TABLE application_documents
ALTER COLUMN uploaded_by TYPE integer USING NULL;

-- Add the NOT NULL constraint after conversion
ALTER TABLE application_documents
ADD CONSTRAINT application_documents_uploaded_by_fk FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT;

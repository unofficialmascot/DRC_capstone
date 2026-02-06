-- Create RAC Reviews table for proper RAC meeting tracking
CREATE TABLE IF NOT EXISTS rac_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  review_number INTEGER NOT NULL,
  review_date DATE NOT NULL,
  remarks TEXT,
  evaluation_result TEXT DEFAULT 'pass',
  document_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for quick lookups by scholar_id
CREATE INDEX IF NOT EXISTS idx_rac_reviews_user_id ON rac_reviews(user_id);

-- Create index for unique review tracking per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_rac_reviews_unique ON rac_reviews(user_id, review_number);

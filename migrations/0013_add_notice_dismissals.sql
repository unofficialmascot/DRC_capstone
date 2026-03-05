CREATE TABLE IF NOT EXISTS notice_dismissals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  notice_id INTEGER NOT NULL,
  dismissed_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notice_dismissals_user_notice_idx
  ON notice_dismissals (user_id, notice_id);

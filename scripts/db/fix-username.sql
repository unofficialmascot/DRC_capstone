-- Quick fix: Remove username from users table if it exists
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS username CASCADE;

-- Ensure email is unique (it should be)
ALTER TABLE IF EXISTS users ADD CONSTRAINT users_email_unique UNIQUE (email) ON CONFLICT DO NOTHING;

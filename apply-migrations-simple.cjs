require('dotenv').config();
const pg = require('pg');
const { Client } = pg;

async function applyMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📝 Applying migrations...\n');

    // Migration 0006: Add gender and isPwd columns
    console.log('Migration 0006: Adding gender and is_pwd columns...');
    await client.query(`
      ALTER TABLE IF EXISTS scholar_personal_details
      ADD COLUMN IF NOT EXISTS gender text;
      
      ALTER TABLE IF EXISTS scholar_personal_details
      ADD COLUMN IF NOT EXISTS is_pwd boolean DEFAULT false;
    `);
    console.log('✅ 0006 applied\n');

    // Migration 0007: Create course_completion table
    console.log('Migration 0007: Creating course_completion table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_completion (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed boolean DEFAULT false,
        completed_on date,
        notes text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ 0007 applied\n');

    // Migration 0008: Backfill gender and is_pwd defaults
    console.log('Migration 0008: Backfilling defaults...');
    await client.query(`
      UPDATE scholar_personal_details 
      SET gender = COALESCE(gender, 'Male'),
          is_pwd = COALESCE(is_pwd, false)
      WHERE gender IS NULL OR is_pwd IS NULL;
    `);
    console.log('✅ 0008 applied\n');

    console.log('🎉 All migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

applyMigrations().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});

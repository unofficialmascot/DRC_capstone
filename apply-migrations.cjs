const pg = require('pg');
const fs = require('fs');
const path = require('path');

const { Pool } = pg;

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Applying migrations...\n');

    // Migration 0006: Add gender and is_pwd
    console.log('📝 Migration 0006: Add gender and is_pwd columns...');
    await client.query(`
      ALTER TABLE IF EXISTS scholar_personal_details
      ADD COLUMN IF NOT EXISTS gender text;
      
      ALTER TABLE IF EXISTS scholar_personal_details
      ADD COLUMN IF NOT EXISTS is_pwd boolean DEFAULT false;
    `);
    console.log('✅ Migration 0006 completed\n');

    // Migration 0007: Create course_completion table
    console.log('📝 Migration 0007: Create course_completion table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_completion (
        id SERIAL PRIMARY KEY,
        scholar_id INTEGER NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
        completed boolean DEFAULT false,
        completed_on date,
        notes text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migration 0007 completed\n');

    // Migration 0008: Backfill gender and is_pwd defaults
    console.log('📝 Migration 0008: Backfill defaults...');
    await client.query(`
      UPDATE scholar_personal_details 
      SET gender = COALESCE(gender, 'Male'),
          is_pwd = COALESCE(is_pwd, false)
      WHERE gender IS NULL OR is_pwd IS NULL;
    `);
    console.log('✅ Migration 0008 completed\n');

    console.log('🎉 All migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { Pool } = pg;

const migrationFiles = [
  'migrations/0006_add_gender_is_pwd.sql',
  'migrations/0007_create_course_completion.sql',
  'migrations/0008_backfill_gender_is_pwd.sql'
];

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...\n');

    for (const file of migrationFiles) {
      try {
        const sql = readFileSync(resolve(file), 'utf-8');
        console.log(`📝 Applying ${file}...`);
        await client.query(sql);
        console.log(`✅ ${file} applied successfully\n`);
      } catch (err) {
        console.error(`❌ Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

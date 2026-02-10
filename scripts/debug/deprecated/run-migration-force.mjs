import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const sql = fs.readFileSync('./migrations/0002_force_apply.sql', 'utf8');
  const client = await pool.connect();
  try {
    console.log('Running force migration 0002_force_apply.sql...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Force migration applied successfully');

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('\nExisting public tables:');
    res.rows.forEach(r => console.log('  -', r.table_name));

    const checks = ['users','scholars','applications','application_reviews','research_progress'];
    for (const t of checks) {
      try {
        const c = await client.query(`SELECT COUNT(*) as count FROM ${t}`);
        console.log(`${t}: ${c.rows[0].count}`);
      } catch (e) {
        console.log(`${t}: (not found)`);
      }
    }
  } catch (err) {
    console.error('Migration failed, rolling back:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) { console.error('Rollback error', e.message); }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

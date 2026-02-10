require('dotenv').config();
const pg = require('pg');

const { Client } = pg;

async function resetSchema() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🧨 Dropping and recreating public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Schema reset complete.');
  } catch (err) {
    console.error('❌ Schema reset failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

resetSchema().catch(() => process.exit(1));

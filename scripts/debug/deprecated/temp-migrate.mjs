import pg from 'pg';

const { Client } = pg;

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Drop username column if it exists
    console.log('Dropping username column...');
    await client.query(`
      ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS username CASCADE;
    `);
    console.log('✓ Username column removed');
    
    console.log('Migration complete!');
    await client.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();

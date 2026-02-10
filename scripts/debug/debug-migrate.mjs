import pg from 'pg';

const { Client } = pg;

async function debug() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    // Check if users table exists and show columns
    const result = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Try to drop username
    try {
      await client.query(`ALTER TABLE users DROP COLUMN username CASCADE;`);
      console.log('\n✓ Removed username column');
    } catch (err) {
      console.log('\nℹ Username column: ' + err.message);
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

debug();

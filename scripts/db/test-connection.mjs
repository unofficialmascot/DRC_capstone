import pg from 'pg';

const { Pool } = pg;

const connectionString = 'postgres://avnadmin:AVNS_rS7PrxTF3ZigYE2NWYg@drcpg-311b7b85-drc123.g.aivencloud.com:20040/defaultdb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: true
});

try {
  const client = await pool.connect();
  const result = await client.query('SELECT version()');
  console.log('✅ Connection successful!');
  console.log('Database version:', result.rows[0].version);
  
  // Check tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log('\nTables in database:');
  tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
  
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}

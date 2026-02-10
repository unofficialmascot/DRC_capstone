import pg from 'pg';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  rejectUnauthorized: false
});

async function testConnection() {
  try {
    console.log('\n🔍 Testing Aiven database connection...');
    console.log(`Database URL: ${process.env.DATABASE_URL.split('@')[0]}@...`);
    
    const client = await pool.connect();
    console.log('✅ Connected to Aiven database!');
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📊 Existing tables in database:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('  (No tables found - database is empty)');
    }
    
    // Check users table if it exists
    try {
      const usersCount = await client.query('SELECT COUNT(*) as count FROM users;');
      console.log(`\n👥 Users in database: ${usersCount.rows[0].count}`);
    } catch (e) {
      console.log(`\n⚠️  Users table not found`);
    }
    
    try {
      const applicationsCount = await client.query('SELECT COUNT(*) as count FROM applications;');
      console.log(`📋 Applications in database: ${applicationsCount.rows[0].count}`);
    } catch (e) {
      console.log(`⚠️  Applications table not found`);
    }
    
    try {
      const progressCount = await client.query('SELECT COUNT(*) as count FROM research_progress;');
      console.log(`📈 Research Progress records: ${progressCount.rows[0].count}`);
    } catch (e) {
      console.log(`⚠️  Research Progress table not found`);
    }
    
    client.release();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();

import pkg from 'pg';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Set NODE_ENV before loading dotenv
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
dotenv.config();

const { Pool } = pkg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false }
  });

  try {
    console.log('📦 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Connected successfully');
    
    console.log('📄 Reading migration file...');
    const migrationSQL = await fs.readFile('./migrations/0005_add_documents_table.sql', 'utf-8');
    
    console.log('🔄 Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Documents table created');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P07') {
      console.log('✅ Table already exists - okay to continue');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
    console.log('🔌 Connection closed');
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });


import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function runMigration() {
  let pool;
  
  try {
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('📦 Connecting to database...');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '0005_add_documents_table.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    if (!sql || sql.trim().length === 0) {
      throw new Error('Migration file is empty');
    }

    console.log('🔄 Running migration: 0005_add_documents_table.sql');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Documents table created with indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    
    if (error.code === 'ENOENT') {
      console.error('   File not found:', error.path);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Database connection refused. Check your DATABASE_URL');
    } else if (error.code === '42P07') {
      console.error('   Table already exists (this is okay)');
      console.log('✅ Migration safe to skip - table already exists');
      return; // Don't throw error if table exists
    } else if (error.message) {
      console.error('   Error:', error.message);
    } else {
      console.error('   Unknown error:', error);
    }
    
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run and handle process exit
runMigration()
  .then(() => {
    console.log('✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed');
    process.exit(1);
  });

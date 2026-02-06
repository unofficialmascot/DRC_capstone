const pg = require('pg');

const { Pool } = pg;

async function checkMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    // Check if gender column exists
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'scholar_personal_details' 
      AND column_name IN ('gender', 'is_pwd')
    `);
    
    if (result.rows.length >= 2) {
      console.log('✅ Migrations applied successfully!');
      console.log('Columns found:', result.rows.map(r => r.column_name).join(', '));
      
      // Check course_completion table
      const tableCheck = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'course_completion'
      `);
      if (tableCheck.rows.length > 0) {
        console.log('✅ course_completion table exists');
      }
    } else {
      console.log('❌ Migrations may not have applied. Columns found:', result.rows.length);
    }
  } catch (err) {
    console.error('Error checking migrations:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMigrations();

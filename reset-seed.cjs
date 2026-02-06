require('dotenv').config();
const pg = require('pg');

const { Pool } = pg;

async function cleanupAndReseed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    // Force IPv4
    family: 4
  });

  const client = await pool.connect();

  try {
    console.log('🧹 Cleaning up old scholar data for fresh seeding...\n');
    
    // Delete in correct order to avoid FK constraints
    await client.query(`DELETE FROM application_reviews WHERE application_id IN (SELECT id FROM applications)`);
    await client.query(`DELETE FROM application_documents WHERE application_id IN (SELECT id FROM applications)`);
    await client.query(`DELETE FROM applications`);
    
    await client.query(`DELETE FROM research_progress`);
    await client.query(`DELETE FROM course_completion`);
    await client.query(`DELETE FROM fee_payments`);
    await client.query(`DELETE FROM scholar_fee_demand`);
    await client.query(`DELETE FROM scholar_rac_members`);
    await client.query(`DELETE FROM scholar_supervisors`);
    await client.query(`DELETE FROM scholar_personal_details`);
    await client.query(`DELETE FROM scholar_reviews`);
    await client.query(`DELETE FROM scholars WHERE id > 0`);
    
    const userRes = await client.query(`DELETE FROM users WHERE role IN ('scholar', 'supervisor', 'drc', 'irc', 'doaa')`);
    console.log(`✅ Deleted ${userRes.rowCount} users`);
    
    const empRes = await client.query(`DELETE FROM employees WHERE id > 0`);
    console.log(`✅ Deleted ${empRes.rowCount} employees`);

    console.log('\n✅ Database cleaned! Seed service will create new demo accounts on restart.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupAndReseed();

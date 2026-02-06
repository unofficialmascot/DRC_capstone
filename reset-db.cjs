require('dotenv').config();
const pg = require('pg');
const { Client } = pg;

async function resetAndPrepare() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🧹 Resetting scholar data for fresh seeding...\n');
    
    // Delete in proper order to avoid FK constraints
    await client.query(`DELETE FROM scholar_rac_members WHERE scholar_id IS NOT NULL`);
    await client.query(`DELETE FROM scholar_supervisors WHERE scholar_id IS NOT NULL`);
    try { await client.query(`DELETE FROM scholar_personal_details WHERE scholar_id IS NOT NULL`); } catch(e) { /* table may not exist */ }
    await client.query(`DELETE FROM research_progress WHERE scholar_id IS NOT NULL`);
    await client.query(`DELETE FROM course_completion WHERE scholar_id IS NOT NULL`);
    await client.query(`DELETE FROM fee_payments WHERE scholar_id IS NOT NULL`);
    await client.query(`DELETE FROM scholar_fee_demand WHERE scholar_id IS NOT NULL`);
    
    // Delete applications and related records
    try { await client.query(`DELETE FROM application_reviews WHERE application_id IS NOT NULL`); } catch(e) { /* table may not exist */ }
    try { await client.query(`DELETE FROM application_documents WHERE application_id IS NOT NULL`); } catch(e) { /* table may not exist */ }
    await client.query(`DELETE FROM applications WHERE scholar_id IS NOT NULL`);
    
    // Delete scholars
    await client.query(`DELETE FROM scholars`);
    
    // Delete users with specific roles
    const userRes = await client.query(`DELETE FROM users WHERE role = 'scholar' OR role = 'supervisor' OR role = 'drc' OR role = 'irc' OR role = 'doaa'`);
    console.log(`✅ Cleared ${userRes.rowCount} users\n`);

    // Delete employees
    const empRes = await client.query(`DELETE FROM employees`);
    console.log(`✅ Cleared ${empRes.rowCount} employees`);

    console.log('\n🎯 Database ready for seeding new demo accounts!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

resetAndPrepare().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});

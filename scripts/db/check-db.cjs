require('dotenv').config();
const pg = require('pg');

const { Client } = pg;

async function checkDB() {
  console.log('Database URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 5000,
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected!');
    
    const result = await client.query(`SELECT COUNT(*) as count FROM scholars;`);
    console.log('Scholars in DB:', result.rows[0].count);
    
    if (result.rows[0].count === 0) {
      console.log('\n✅ Database is clean - ready for seeding!');
    } else {
      console.log('\n⚠️  Database has', result.rows[0].count, 'scholars');
    }
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('Code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDB().then(() => process.exit(0)).catch(() => process.exit(1));

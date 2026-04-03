import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { eq, or } from 'drizzle-orm';
import { scholars, employees } from './shared/schema.ts';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkAssignments() {
  try {
    // Get all scholars with their supervisors
    const allScholars = await db.select().from(scholars);
    
    console.log('\n=== SCHOLAR-SUPERVISOR ASSIGNMENTS ===');
    allScholars.forEach(s => {
      console.log(`${s.scholarId}: supervisor=${s.supervisorId || 'NONE'}, co-supervisor=${s.coSupervisorId || 'NONE'}`);
    });
    
    // Get all supervisors
    const allEmployees = await db.select().from(employees);
    console.log('\n=== AVAILABLE EMPLOYEES ===');
    allEmployees.forEach(e => {
      console.log(`${e.employeeId}: ${e.designation} (${e.department})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkAssignments();

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { eq } from 'drizzle-orm';
import { scholars } from './shared/schema.ts';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function fixSupervisorAssignments() {
  try {
    console.log('Updating supervisor assignments...');
    
    // Update scholar 1
    await db
      .update(scholars)
      .set({ supervisorId: 'EMP-SUPERVISOR-001' })
      .where(eq(scholars.scholarId, 'GITAM-SCH-2020-118'));
    
    // Update scholar 2
    await db
      .update(scholars)
      .set({ supervisorId: 'EMP-SUPERVISOR-001' })
      .where(eq(scholars.scholarId, 'GITAM-SCH-2021-204'));
    
    console.log('✓ Supervisor assignments updated successfully');
    
    // Verify
    const updatedScholars = await db
      .select()
      .from(scholars)
      .where(eq(scholars.supervisorId, 'EMP-SUPERVISOR-001'));
    
    console.log('\nAssigned scholars:');
    updatedScholars.forEach(s => {
      console.log(`  - ${s.scholarId}: ${s.supervisorId}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixSupervisorAssignments();

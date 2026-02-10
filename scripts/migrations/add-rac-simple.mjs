import { db } from './server/db.ts';
import { scholars, scholarRacMembers } from './shared/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function addRacMeetings() {
  try {
    console.log("Fetching eligible scholars...");
    
    // Get scholar IDs
    const eligibleScholars = await db.query.scholars.findMany({
      where: inArray(scholars.scholarId, [
        'GITAM-SCH-2021-204',  // Priya Reddy
        'GITAM-SCH-2019-087',  // Arvind Singh  
        'GITAM-SCH-2021-098'   // Meera Gupta
      ])
    });
    
    console.log("Found eligible scholars:", eligibleScholars.map(s => s.scholarId));
    
    // Add 3 RAC meetings for each eligible scholar
    for (const scholar of eligibleScholars) {
      console.log(`\nAdding RAC meetings for ${scholar.scholarId}...`);
      
      // For this demo, we'll just add 3 entries with the same rac_member_id
      // In a real scenario, these would be different advisors
      const racMemberId = 1; // Assuming ID 1 exists
      
      for (let i = 0; i < 3; i++) {
        const roles = ['drc', 'irc', 'doaa'];
        try {
          const result = await db.insert(scholarRacMembers)
            .values({
              userId: scholar.userId,
              racMemberId,
              role: roles[i]
            })
            .returning();
          console.log(`  ✓ Added RAC meeting ${i + 1} (${roles[i].toUpperCase()})`);
        } catch (err) {
          console.log(`  ℹ RAC meeting ${i + 1} already exists or skipped`);
        }
      }
    }
    
    console.log("\n✅ RAC meetings setup complete!");
    process.exit(0);
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addRacMeetings();

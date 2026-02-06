import pkg from 'pg';
const { Client } = pkg;

async function addRacMeetings() {
  const client = new Client({
    connectionString: "postgres://avnadmin:AVNS_rS7PrxTF3ZigYE2NWYg@drcpg-311b7b85-drc123.g.aivencloud.com:20040/defaultdb?sslmode=require",
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected!");
    
    // Get the scholar IDs for the eligible ones
    const scholarQuery = `
      SELECT id, scholar_id FROM scholars 
      WHERE scholar_id IN ('GITAM-SCH-2021-204', 'GITAM-SCH-2019-087', 'GITAM-SCH-2021-098')
    `;
    
    const result = await client.query(scholarQuery);
    const scholars = result.rows;
    
    if (scholars.length === 0) {
      console.log("❌ No eligible scholars found!");
      return;
    }
    
    console.log("✓ Found eligible scholars:", scholars.map(s => s.scholar_id).join(", "));
    
    // Get or create RAC members
    const racMembersQuery = `
      SELECT id FROM users 
      WHERE role IN ('drc', 'irc', 'doaa', 'guide') 
      LIMIT 5
    `;
    
    const racMembersResult = await client.query(racMembersQuery);
    const racMembers = racMembersResult.rows;
    
    if (racMembers.length === 0) {
      console.log("Creating dummy RAC members...");
      
      // Create dummy RAC members
      const insertQuery = `
        INSERT INTO users (username, password, role, name, email) 
        VALUES 
          ('drc-member-1', 'hashed_password', 'drc', 'DRC Member 1', 'drc1@gitam.edu'),
          ('irc-member-1', 'hashed_password', 'irc', 'IRC Member 1', 'irc1@gitam.edu'),
          ('doaa-member-1', 'hashed_password', 'doaa', 'DOAA Member 1', 'doaa1@gitam.edu'),
          ('guide-member-1', 'hashed_password', 'guide', 'Guide Member 1', 'guide1@gitam.edu')
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `;
      
      const insertResult = await client.query(insertQuery);
      const newMembers = insertResult.rows;
      console.log("✓ Created RAC members");
      
      // Now add RAC member assignments for each eligible scholar (3 meetings each)
      for (const scholar of scholars) {
        console.log(`\n📝 Adding RAC meetings for scholar ${scholar.scholar_id}...`);
        
        // Add 3 RAC meeting entries
        for (let i = 0; i < 3; i++) {
          const memberIndex = i % newMembers.length;
          const memberId = newMembers[memberIndex].id;
          const roles = ['drc', 'irc', 'doaa'];
          
          const assignQuery = `
            INSERT INTO scholar_rac_members (scholar_id, rac_member_id, role, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT DO NOTHING
          `;
          
          await client.query(assignQuery, [scholar.id, memberId, roles[i]]);
          console.log(`  ✓ Added RAC meeting ${i + 1} - ${roles[i].toUpperCase()}`);
        }
      }
    } else {
      console.log("✓ RAC members exist, using them...");
      
      // Add assignments using existing RAC members
      for (const scholar of scholars) {
        console.log(`\n📝 Adding RAC meetings for scholar ${scholar.scholar_id}...`);
        
        for (let i = 0; i < 3; i++) {
          const memberId = racMembers[i % racMembers.length].id;
          const roles = ['drc', 'irc', 'doaa'];
          
          const assignQuery = `
            INSERT INTO scholar_rac_members (scholar_id, rac_member_id, role, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT DO NOTHING
          `;
          
          await client.query(assignQuery, [scholar.id, memberId, roles[i]]);
          console.log(`  ✓ Added RAC meeting ${i + 1} - ${roles[i].toUpperCase()}`);
        }
      }
    }
    
    console.log("\n✅ RAC meetings added successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

addRacMeetings();

import pkg from 'pg';
const { Client } = pkg;

async function seedRacReviews() {
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
    
    // First, apply the migration if not already done
    console.log("\n📝 Creating rac_reviews table...");
    const tableQuery = `
      CREATE TABLE IF NOT EXISTS rac_reviews (
        id SERIAL PRIMARY KEY,
        scholar_id INTEGER NOT NULL,
        review_number INTEGER NOT NULL,
        review_date DATE NOT NULL,
        remarks TEXT,
        evaluation_result TEXT DEFAULT 'pass',
        document_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE,
        UNIQUE (scholar_id, review_number)
      );
      
      CREATE INDEX IF NOT EXISTS idx_rac_reviews_scholar_id ON rac_reviews(scholar_id);
    `;
    
    await client.query(tableQuery);
    console.log("✓ rac_reviews table created/verified");
    
    // Get the eligible scholars
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
    
    console.log(`✓ Found eligible scholars: ${scholars.map(s => s.scholar_id).join(", ")}`);
    
    // Add 3 RAC reviews for each eligible scholar
    for (const scholar of scholars) {
      console.log(`\n📝 Adding RAC reviews for scholar ${scholar.scholar_id}...`);
      
      // Add 3 RAC reviews with dates
      const baseDate = new Date('2024-01-15');
      
      for (let i = 0; i < 3; i++) {
        const reviewDate = new Date(baseDate);
        reviewDate.setMonth(reviewDate.getMonth() + (i * 4)); // Space reviews 4 months apart
        
        const insertQuery = `
          INSERT INTO rac_reviews (scholar_id, review_number, review_date, remarks, evaluation_result)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (scholar_id, review_number) DO NOTHING
        `;
        
        const remarks = `RAC Review ${i + 1} - Held on ${reviewDate.toDateString()}. Scholar presented research progress and received constructive feedback.`;
        
        await client.query(insertQuery, [
          scholar.id,
          i + 1,
          reviewDate.toISOString().split('T')[0],
          remarks,
          'pass'
        ]);
        
        console.log(`  ✓ Added RAC Review ${i + 1} - ${reviewDate.toLocaleDateString()}`);
      }
    }
    
    console.log("\n✅ RAC reviews seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

seedRacReviews();

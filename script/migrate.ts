 import pg from "pg";
 import "dotenv/config";

 const { Pool } = pg;
import { readFile } from "fs/promises";

async function applyMigration() {
  try {
     const pool = new Pool({
       connectionString: process.env.DATABASE_URL,
       ssl: { rejectUnauthorized: false }
     });

     const client = await pool.connect();
    
    const migrations = [
      "./migrations/0006_add_gender_is_pwd.sql",
      "./migrations/0007_create_course_completion.sql",
      "./migrations/0008_backfill_gender_is_pwd.sql"
    ];
    
    console.log("🔄 Starting database migrations...");
    for (const migrationFile of migrations) {
      const sql = await readFile(migrationFile, "utf-8");
      console.log(`  Applying ${migrationFile}...`);
      await client.query(sql);
      console.log(`  ✅ ${migrationFile} completed`);
    }
    
    console.log("✅ All migrations completed successfully!");
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}


applyMigration();

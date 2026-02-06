import pg from "pg";
import { readFileSync } from "fs";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL environment variable not set");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected!");

    console.log("\nApplying migration 0010_standardize_id_types.sql...");
    
    // Read migration file
    const sql = readFileSync("./migrations/0010_standardize_id_types.sql", "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`\nExecuting: ${statement.substring(0, 80)}...`);
      await client.query(statement);
      console.log("✓ Done");
    }
    
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

import pg from "pg";
import { readFileSync } from "fs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL environment variable not set");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected!");

    console.log("\nApplying migration 0010_standardize_id_types.sql...\n");
    
    // Read migration file
    const sql = readFileSync("./migrations/0010_standardize_id_types.sql", "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 70)}...`);
      try {
        await client.query(statement);
        console.log("✓ Success\n");
      } catch (err) {
        console.error(`✗ Error: ${(err).message}\n`);
        // Continue with other statements, but track the error
        if (!process.env.IGNORE_MIGRATION_ERRORS) {
          throw err;
        }
      }
    }
    
    console.log("✅ Migration completed!");
    process.exit(0);
  } catch (err) {
    console.error("\n✗ Migration failed:", (err).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

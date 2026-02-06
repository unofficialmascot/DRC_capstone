import { pool } from "./server/db";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log("Applying migration 0010_standardize_id_types...\n");
    
    // Read migration file
    const migrationPath = join(__dirname, "migrations/0010_standardize_id_types.sql");
    const sql = readFileSync(migrationPath, "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 70)}...`);
      try {
        await pool.query(statement);
        console.log("✓ Success\n");
      } catch (err: any) {
        console.error(`✗ Failed: ${err.message}\n`);
        throw err;
      }
    }
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("\n✗ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

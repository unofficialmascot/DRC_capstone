import { db } from "./server/db.ts";

async function runMigration() {
  try {
    console.log("Applying schema migration...");
    
    // Execute the migration SQL
    const fs = await import("fs");
    const sql = fs.readFileSync("./migrations/0004_reset_schema.sql", "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql.split(";").filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 80) + "...");
        await db.execute(statement);
      }
    }
    
    console.log("✓ Migration completed successfully!");
  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  }
}

runMigration();

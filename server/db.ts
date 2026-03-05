import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import fs from "fs";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const normalizedDatabaseUrl = (() => {
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslrootcert");
  return url.toString();
})();

const poolConfig: pg.PoolConfig = {
  connectionString: normalizedDatabaseUrl,
  ssl: (() => {
    const caFile = process.env.DB_SSL_CA_FILE;

    if (caFile) {
      return {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caFile, "utf8"),
      };
    }

    return process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false };
  })(),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;
const useFileStorage = process.env.DEMO_FILE_STORAGE === "true";

if (!process.env.DATABASE_URL && !useFileStorage) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig: pg.PoolConfig | null = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
    }
  : null;

const unavailable = new Proxy(
  {},
  {
    get: () => {
      throw new Error(
        "Database connection is unavailable (DEMO_FILE_STORAGE=true).",
      );
    },
  },
);

export const pool = poolConfig ? new Pool(poolConfig) : (unavailable as pg.Pool);
export const db = poolConfig
  ? drizzle(pool, { schema })
  : (unavailable as ReturnType<typeof drizzle>);

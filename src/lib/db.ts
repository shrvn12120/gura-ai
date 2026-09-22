import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.PG_DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing PG_DATABASE_URL environment variable.");
}

const isLocalDatabase = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: isLocalDatabase
    ? false
    : {
        rejectUnauthorized: false,
      },
});

globalThis.__pgPool ??= pool;

export const db = globalThis.__pgPool;
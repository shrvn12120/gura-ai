import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.PG_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
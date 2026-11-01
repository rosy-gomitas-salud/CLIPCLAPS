import pg from "pg";
const { Pool } = pg;
let pool;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no configurada");
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 30000 });
  return pool;
}

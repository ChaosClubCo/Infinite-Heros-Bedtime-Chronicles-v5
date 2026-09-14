import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

let db: any;
try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  pool.on('error', (err: Error) => {
    console.error('[DB] Unexpected pool error:', err instanceof Error ? err.message : String(err));
  });

  db = drizzle(pool);
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy({}, {
    get: (_, prop) => prop === 'query'
      ? new Proxy({}, { get: () => noOp }) : async () => [],
  });
}

export { db };

let _db: ReturnType<typeof drizzle> | null = null;

import { drizzle } from "drizzle-orm/node-postgres";

export function getDb() {
  if (_db) return _db;

  _db = drizzle({
    connection: {
      connectionString: process.env.DATABASE_URL!,
    },
  });

  return _db;
}

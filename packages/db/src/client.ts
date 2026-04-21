import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

export type DbClient = ReturnType<typeof createClient>;

export function createClient(connectionUri: string) {
  const pool = mysql.createPool({
    uri: connectionUri,
    connectionLimit: 20,
    enableKeepAlive: true,
    waitForConnections: true,
    queueLimit: 0,
  });

  const db = drizzle(pool, { schema, mode: 'default' });

  return {
    db,
    async close() {
      await pool.end();
    },
  };
}

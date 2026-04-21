import { createClient } from '@inventory/db/client';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const { db, close } = createClient(config.DB_URL);

export { db };

export async function closeDb(): Promise<void> {
  logger.info('closing database connection pool');
  await close();
}

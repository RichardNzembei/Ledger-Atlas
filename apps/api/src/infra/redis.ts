import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export const redis: Redis | null = config.REDIS_URL
  ? new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    })
  : null;

if (redis) {
  redis.on('error', (err: Error) => {
    logger.error({ err }, 'Redis connection error');
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });
}

export async function closeRedis(): Promise<void> {
  if (!redis) return;
  logger.info('closing Redis connection');
  await redis.quit();
}

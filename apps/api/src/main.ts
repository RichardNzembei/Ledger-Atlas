import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './infra/logger.js';
import { closeDb } from './infra/db.js';
import { closeRedis } from './infra/redis.js';
import { startRulesListener } from './infra/rulesListener.js';

async function main() {
  const app = createApp();
  await startRulesListener();

  const server = app.listen(config.API_PORT, () => {
    logger.info(
      { port: config.API_PORT, env: config.NODE_ENV },
      'Inventory Platform API listening',
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated');
    server.close(async () => {
      await Promise.allSettled([closeDb(), closeRedis()]);
      logger.info('Shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
}

main().catch((err: unknown) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
